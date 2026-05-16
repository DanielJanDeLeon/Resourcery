from itertools import chain
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Booking, Notification, DamageReport
from .serializers import BookingSerializer, CreateBookingSerializer
from .auth import require_auth


def _date_label(booking):
    if booking.return_date:
        return f"{booking.date} – {booking.return_date}"
    return str(booking.date)


def _notify_admin(booking, notif_type):
    Notification.objects.create(
        recipient='admin',
        type=notif_type,
        booking_id=booking.id,
        resource_name=booking.resource_name,
        username=booking.username,
        date=_date_label(booking),
    )

def _notify_resident(booking, notif_type):
    Notification.objects.create(
        recipient=booking.username,
        type=notif_type,
        booking_id=booking.id,
        resource_name=booking.resource_name,
        username=booking.username,
        date=_date_label(booking),
    )


def _find_overlap(resource_id, pickup, ret, statuses):
    conflict = Booking.objects.filter(
        resource_id=resource_id,
        status__in=statuses,
    ).filter(date__lte=ret, return_date__gte=pickup).first()

    if not conflict:
        conflict = Booking.objects.filter(
            resource_id=resource_id,
            status__in=statuses,
            return_date__isnull=True,
            date__range=[pickup, ret],
        ).first()

    return conflict


def _is_exact_overlap(existing, pickup, ret):
    ex_start = existing.date
    ex_end = existing.return_date or existing.date
    return ex_start == pickup and ex_end == ret


def _get_resource_quantity(resource_id):
    """Fetch the total quantity of a resource directly from the shared database."""
    from django.db import connection
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT quantity FROM resources WHERE id = %s', [resource_id])
            row = cursor.fetchone()
            return row[0] if row else 1
    except Exception:
        return 1


def _booked_quantity(resource_id, pickup, ret, exclude_id=None):
    """Sum of quantity_requested for confirmed overlapping bookings (approved only)."""
    qs = Booking.objects.filter(
        resource_id=resource_id,
        status__in=['for_pickup', 'not_returned'],
    ).filter(date__lte=ret, return_date__gte=pickup)
    if not qs.exists():
        qs = Booking.objects.filter(
            resource_id=resource_id,
            status__in=['for_pickup', 'not_returned'],
            return_date__isnull=True,
            date__range=[pickup, ret],
        )
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    return sum(b.quantity_requested for b in qs)


class BookingCreateView(APIView):
    """POST /bookings"""

    @require_auth()
    def post(self, request):
        username = request.jwt_payload['sub']

        serializer = CreateBookingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        resource_id = data['resource_id']
        resource_type = data.get('resource_type', '')
        pickup = data['date']
        ret = data.get('return_date') or pickup
        qty_requested = data.get('quantity_requested', 1)
        is_single_day_venue = (resource_type == 'Venue' and not data.get('return_date'))

        def _time_slots_overlap(b):
            """Check if a booking's time slot overlaps with the requested slot (venue only)."""
            if not is_single_day_venue or b.date != pickup:
                return True  # non-venue or multi-day: always conflict on date overlap
            req_start = data.get('time')
            req_end = data.get('end_time')
            ex_start = b.time
            ex_end = b.end_time
            if req_start and req_end and ex_start and ex_end:
                return req_start < ex_end and req_end > ex_start
            return True  # no end time = full day block

        # Check approved (for_pickup) conflicts first (hard block for everyone)
        approved_conflict = _find_overlap(resource_id, pickup, ret, ['for_pickup'])
        if approved_conflict and not _time_slots_overlap(approved_conflict):
            approved_conflict = None

        if approved_conflict:
            if approved_conflict.username == username:
                # Same user with for_pickup booking — offer extension/update
                ex_end = approved_conflict.return_date or approved_conflict.date
                if _is_exact_overlap(approved_conflict, pickup, ret):
                    return Response(
                        {'error': "You've already booked this resource for the selected dates."},
                        status=status.HTTP_409_CONFLICT
                    )
                is_actual_extension = ret > ex_end
                return Response(
                    {
                        'conflict_type': 'approved_extension',
                        'booking_id': approved_conflict.id,
                        'merged_start': str(pickup),
                        'merged_end': str(ret),
                        'is_extension': is_actual_extension,
                    },
                    status=status.HTTP_409_CONFLICT
                )
            else:
                # Check if enough quantity remains
                total_qty = _get_resource_quantity(resource_id)
                already_booked = _booked_quantity(resource_id, pickup, ret)
                available = total_qty - already_booked
                if available < qty_requested:
                    return Response(
                        {'error': f'Not enough quantity available. Only {max(available, 0)} left for those dates.'},
                        status=status.HTTP_409_CONFLICT
                    )

        # Check same-user pending conflicts (update existing pending booking)
        own_pending = _find_overlap(resource_id, pickup, ret, ['pending'])
        if own_pending and not _time_slots_overlap(own_pending):
            own_pending = None
        if own_pending and own_pending.username == username:
            if _is_exact_overlap(own_pending, pickup, ret):
                return Response(
                    {'error': "You've already booked this resource for the selected dates."},
                    status=status.HTTP_409_CONFLICT
                )
            own_pending.date = pickup
            own_pending.return_date = ret if data.get('return_date') else None
            own_pending.is_extension = False
            own_pending.is_update = False
            own_pending.save()
            _notify_admin(own_pending, 'booking_update')
            return Response(
                {**BookingSerializer(own_pending).data, 'merged': True},
                status=status.HTTP_200_OK
            )
        # If pending conflict is from another user — allow through (admin decides)

        booking = Booking.objects.create(username=username, **data)
        _notify_admin(booking, 'new_booking')
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingExtendView(APIView):
    """PATCH /bookings/{id}/extend"""

    @require_auth()
    def patch(self, request, booking_id):
        username = request.jwt_payload['sub']

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        if booking.username != username:
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        if booking.status not in ['for_pickup', 'not_returned']:
            return Response(
                {'error': 'Only approved or not-returned bookings can be extended via this endpoint.'},
                status=status.HTTP_409_CONFLICT
            )

        merged_start = request.data.get('merged_start')
        merged_end = request.data.get('merged_end')
        if not merged_start or not merged_end:
            return Response({'error': 'merged_start and merged_end are required.'}, status=status.HTTP_400_BAD_REQUEST)

        is_ext = request.data.get('is_extension', False)
        if not booking.original_return_date:
            booking.original_return_date = booking.return_date
        booking.date = merged_start
        booking.return_date = merged_end
        booking.status = 'pending'
        booking.is_extension = is_ext
        booking.is_update = not is_ext
        booking.save()

        notif_type = 'booking_extension' if is_ext else 'booking_update'
        _notify_admin(booking, notif_type)

        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)


class MyBookingsView(APIView):
    """GET /bookings/my"""

    @require_auth()
    def get(self, request):
        username = request.jwt_payload['sub']
        bookings = Booking.objects.filter(username=username)
        return Response(BookingSerializer(bookings, many=True).data)


class ResourceBookingsView(APIView):
    """GET /bookings/resources — active bookings per resource.
    Returns approved bookings from all users + the current user's own pending bookings.
    """

    @require_auth()
    def get(self, request):
        username = request.jwt_payload['sub']
        # for_pickup + not_returned bookings from everyone (block those dates)
        active = Booking.objects.filter(status__in=['for_pickup', 'not_returned'])
        # Pending bookings only for the current user
        own_pending = Booking.objects.filter(status='pending', username=username)
        bookings = list(chain(active, own_pending))
        return Response(BookingSerializer(bookings, many=True).data)


class AdminBookingsView(APIView):
    """GET /bookings/all"""

    @require_auth(roles=['ROLE_ADMIN'])
    def get(self, request):
        bookings = Booking.objects.all()
        return Response(BookingSerializer(bookings, many=True).data)


class AdminBookingUpdateView(APIView):
    """PATCH /bookings/{id}/status"""

    @require_auth(roles=['ROLE_ADMIN'])
    def patch(self, request, booking_id):
        new_status = request.data.get('status')
        if new_status not in ['for_pickup', 'declined', 'pending', 'not_returned', 'returned', 'under_inspection']:
            return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        if new_status == 'for_pickup':
            pickup_date = booking.date
            ret_date = booking.return_date or booking.date

            # Get total resource quantity
            total_qty = _get_resource_quantity(booking.resource_id)

            # Sum already-approved quantities for overlapping dates (excluding this booking)
            already_approved = _booked_quantity(booking.resource_id, pickup_date, ret_date, exclude_id=booking_id)

            # Check if approving this booking would exceed total quantity
            if already_approved + booking.quantity_requested > total_qty:
                remaining = max(0, total_qty - already_approved)
                return Response(
                    {
                        'error': f'Cannot approve: only {remaining} unit(s) available for those dates (total: {total_qty}, already approved: {already_approved}).',
                    },
                    status=status.HTTP_409_CONFLICT
                )

            # Auto-decline other pending bookings only if no capacity remains after this approval
            overlapping_pending = Booking.objects.filter(
                resource_id=booking.resource_id,
                status='pending',
            ).filter(date__lte=ret_date, return_date__gte=pickup_date).exclude(id=booking_id)

            if not overlapping_pending.exists():
                overlapping_pending = Booking.objects.filter(
                    resource_id=booking.resource_id,
                    status='pending',
                    return_date__isnull=True,
                    date__range=[pickup_date, ret_date],
                ).exclude(id=booking_id)

            # Only auto-decline if approving this + remaining pending would exceed capacity
            capacity_after_this = total_qty - already_approved - booking.quantity_requested
            running = 0
            for b in overlapping_pending:
                running += b.quantity_requested
                if running > capacity_after_this:
                    b.status = 'declined'
                    b.save()
                    _notify_resident(b, 'booking_declined')

        booking.status = new_status
        if new_status == 'for_pickup':
            # If this is an extension/update approval, the resident already has the item
            # so skip "for pickup" and go straight to not_returned
            if booking.is_extension or booking.is_update:
                booking.status = 'not_returned'
            booking.is_extension = False
            booking.is_update = False
        booking.save()

        if booking.status == 'for_pickup':
            _notify_resident(booking, 'booking_approved')
        elif new_status == 'for_pickup' and booking.status == 'not_returned':
            # Extension/update approved — notify as picked up since they already have it
            _notify_resident(booking, 'booking_picked_up')
        elif new_status == 'declined':
            _notify_resident(booking, 'booking_declined')
        elif new_status == 'not_returned':
            _notify_resident(booking, 'booking_picked_up')

        return Response(BookingSerializer(booking).data)


class AdminDeleteUserBookingsView(APIView):
    """DELETE /bookings/user/{username}"""

    @require_auth(roles=['ROLE_ADMIN'])
    def delete(self, request, username):
        Booking.objects.filter(username=username, status='for_pickup').update(status='declined')
        Booking.objects.filter(username=username, status='pending').delete()
        return Response({'deleted': True})


class BookingCancelExtensionView(APIView):
    """PATCH /bookings/{id}/cancel-extension — revert a pending extension back to not_returned."""

    @require_auth()
    def patch(self, request, booking_id):
        username = request.jwt_payload['sub']

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        if booking.username != username:
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        if not (booking.status == 'pending' and booking.is_extension):
            return Response({'error': 'No pending extension to cancel.'}, status=status.HTTP_409_CONFLICT)

        booking.status = 'not_returned'
        booking.return_date = booking.original_return_date
        booking.original_return_date = None
        booking.is_extension = False
        booking.is_update = False
        booking.save()
        return Response(BookingSerializer(booking).data)


class BookingCancelView(APIView):
    """PATCH /bookings/{id}/cancel — resident cancels their own pending or approved booking."""

    @require_auth()
    def patch(self, request, booking_id):
        username = request.jwt_payload['sub']

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        if booking.username != username:
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        if booking.status not in ['pending', 'for_pickup']:
            return Response({'error': 'Only pending or approved bookings can be cancelled.'}, status=status.HTTP_409_CONFLICT)

        booking.status = 'cancelled'
        booking.save()
        _notify_admin(booking, 'booking_cancelled')
        return Response(BookingSerializer(booking).data)


# ── Notification endpoints ────────────────────────────────────────────────────
class NotificationListView(APIView):
    """GET /notifications — fetch notifications for the current user (or admin)."""

    @require_auth()
    def get(self, request):
        username = request.jwt_payload['sub']
        roles = request.jwt_payload.get('roles', [])
        if 'ROLE_ADMIN' in roles:
            notifs = Notification.objects.filter(recipient='admin')
        else:
            notifs = Notification.objects.filter(recipient=username)
        data = [
            {
                'id': n.id,
                'type': n.type,
                'booking_id': n.booking_id,
                'resource_name': n.resource_name,
                'username': n.username,
                'date': n.date,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat(),
            }
            for n in notifs
        ]
        return Response(data)


class NotificationMarkReadView(APIView):
    """PATCH /notifications/read — mark all as read for current user."""

    @require_auth()
    def patch(self, request):
        username = request.jwt_payload['sub']
        roles = request.jwt_payload.get('roles', [])
        if 'ROLE_ADMIN' in roles:
            Notification.objects.filter(recipient='admin', is_read=False).update(is_read=True)
        else:
            Notification.objects.filter(recipient=username, is_read=False).update(is_read=True)
        return Response({'ok': True})


class NotificationClearView(APIView):
    """DELETE /notifications — delete all notifications for current user."""

    @require_auth()
    def delete(self, request):
        username = request.jwt_payload['sub']
        roles = request.jwt_payload.get('roles', [])
        if 'ROLE_ADMIN' in roles:
            Notification.objects.filter(recipient='admin').delete()
        else:
            Notification.objects.filter(recipient=username).delete()
        return Response({'ok': True})


class ResourceAvailabilityView(APIView):
    """GET /bookings/availability?resource_id=X&date=Y&return_date=Z"""

    @require_auth()
    def get(self, request):
        resource_id = request.query_params.get('resource_id')
        date = request.query_params.get('date')
        return_date = request.query_params.get('return_date') or date

        if not resource_id or not date:
            return Response({'error': 'resource_id and date are required.'}, status=status.HTTP_400_BAD_REQUEST)

        total_qty = _get_resource_quantity(int(resource_id))
        booked = _booked_quantity(int(resource_id), date, return_date)
        available = max(0, total_qty - booked)

        return Response({'resource_id': resource_id, 'total': total_qty, 'booked': booked, 'available': available})


# ── Damage Report endpoints ───────────────────────────────────────────────────

def _set_resource_status(resource_id, new_status):
    """Update a resource's status directly in the shared database."""
    from django.db import connection
    try:
        with connection.cursor() as cursor:
            cursor.execute('UPDATE resources SET status = %s WHERE id = %s', [new_status, resource_id])
    except Exception:
        pass


class DamageReportCreateView(APIView):
    """POST /damage-reports — admin files a damage report."""

    @require_auth(roles=['ROLE_ADMIN'])
    def post(self, request):
        reported_by   = request.jwt_payload['sub']
        booking_id    = request.data.get('booking_id')
        resource_id   = request.data.get('resource_id', 0)
        resource_name = request.data.get('resource_name', '')
        username      = request.data.get('username', '')
        description   = request.data.get('description', '').strip()
        severity      = request.data.get('severity', 'minor')
        quantity_damaged = int(request.data.get('quantity_damaged', 1))

        if not description:
            return Response({'error': 'Description is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if severity not in ['minor', 'moderate', 'severe']:
            return Response({'error': 'Invalid severity.'}, status=status.HTTP_400_BAD_REQUEST)

        report = DamageReport.objects.create(
            booking_id=booking_id,
            resource_id=resource_id,
            resource_name=resource_name,
            username=username,
            description=description,
            severity=severity,
            reported_by=reported_by,
            quantity_damaged=quantity_damaged,
        )

        # Check total quantity vs total active (unresolved) damaged quantity
        total_qty = _get_resource_quantity(int(resource_id)) if resource_id else 1
        damaged_qty = DamageReport.objects.filter(
            resource_id=resource_id, resolved=False
        ).aggregate(total=__import__('django.db.models', fromlist=['Sum']).Sum('quantity_damaged'))['total'] or 0

        # If all units are damaged, mark resource as under maintenance
        if damaged_qty >= total_qty:
            _set_resource_status(resource_id, 'under maintenance')

        # Notify the resident
        Notification.objects.create(
            recipient=username,
            type='damage_report',
            booking_id=booking_id,
            resource_name=resource_name,
            username=username,
            date=str(report.created_at.date()),
        )

        return Response({
            'id': report.id,
            'booking_id': report.booking_id,
            'resource_id': report.resource_id,
            'resource_name': report.resource_name,
            'username': report.username,
            'description': report.description,
            'severity': report.severity,
            'quantity_damaged': report.quantity_damaged,
            'reported_by': report.reported_by,
            'resolved': report.resolved,
            'created_at': report.created_at.isoformat(),
        }, status=status.HTTP_201_CREATED)


class DamageReportListView(APIView):
    """GET /damage-reports — admin gets all, resident gets their own."""

    @require_auth()
    def get(self, request):
        username = request.jwt_payload['sub']
        roles = request.jwt_payload.get('roles', [])
        if 'ROLE_ADMIN' in roles:
            reports = DamageReport.objects.all()
        else:
            reports = DamageReport.objects.filter(username=username)

        def serialize(r):
            d = {
                'id': r.id,
                'booking_id': r.booking_id,
                'resource_id': r.resource_id,
                'resource_name': r.resource_name,
                'username': r.username,
                'description': r.description,
                'severity': r.severity,
                'quantity_damaged': r.quantity_damaged,
                'reported_by': r.reported_by,
                'resolved': r.resolved,
                'created_at': r.created_at.isoformat(),
            }
            if r.resolved_at:
                d['resolved_at'] = r.resolved_at.isoformat()
                d['resolved_by'] = r.resolved_by
            return d

        return Response([serialize(r) for r in reports])


class DamageReportResolveView(APIView):
    """PATCH /damage-reports/{id}/resolve — admin marks a damage report as resolved."""

    @require_auth(roles=['ROLE_ADMIN'])
    def patch(self, request, report_id):
        from django.utils import timezone
        from django.db.models import Sum

        try:
            report = DamageReport.objects.get(id=report_id)
        except DamageReport.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        if report.resolved:
            return Response({'error': 'Already resolved.'}, status=status.HTTP_400_BAD_REQUEST)

        resolved_by = request.jwt_payload['sub']
        report.resolved = True
        report.resolved_at = timezone.now()
        report.resolved_by = resolved_by
        report.save()

        # Check if remaining unresolved damage still covers all units
        resource_id = report.resource_id
        if resource_id:
            total_qty = _get_resource_quantity(int(resource_id))
            remaining_damaged = DamageReport.objects.filter(
                resource_id=resource_id, resolved=False
            ).aggregate(total=Sum('quantity_damaged'))['total'] or 0

            # If damaged qty no longer covers all units, restore to available
            if remaining_damaged < total_qty:
                _set_resource_status(resource_id, 'available')

        return Response({
            'id': report.id,
            'resolved': report.resolved,
            'resolved_at': report.resolved_at.isoformat(),
            'resolved_by': report.resolved_by,
        })


# ── Terms & Conditions endpoints ──────────────────────────────────────────────

class TermsView(APIView):
    """GET /terms — public. PUT /terms — admin only."""

    def get(self, request):
        from .models import TermsAndConditions
        obj = TermsAndConditions.objects.first()
        if not obj:
            return Response({'content': [], 'updated_at': None, 'updated_by': None})
        return Response({
            'content': obj.content,
            'updated_at': obj.updated_at.isoformat(),
            'updated_by': obj.updated_by,
        })

    @require_auth(roles=['ROLE_ADMIN'])
    def put(self, request):
        from .models import TermsAndConditions
        username = request.jwt_payload['sub']
        content = request.data.get('content', [])
        obj, _ = TermsAndConditions.objects.get_or_create(id=1)
        obj.content = content
        obj.updated_by = username
        obj.save()
        return Response({'content': obj.content, 'updated_at': obj.updated_at.isoformat(), 'updated_by': obj.updated_by})


# ── Privacy Policy endpoints ───────────────────────────────────────────────────

class PrivacyView(APIView):
    """GET /privacy — public. PUT /privacy — admin only."""

    def get(self, request):
        from .models import PrivacyPolicy
        obj = PrivacyPolicy.objects.first()
        if not obj:
            return Response({'content': [], 'updated_at': None, 'updated_by': None})
        return Response({
            'content': obj.content,
            'updated_at': obj.updated_at.isoformat(),
            'updated_by': obj.updated_by,
        })

    @require_auth(roles=['ROLE_ADMIN'])
    def put(self, request):
        from .models import PrivacyPolicy
        username = request.jwt_payload['sub']
        content = request.data.get('content', [])
        obj, _ = PrivacyPolicy.objects.get_or_create(id=1)
        obj.content = content
        obj.updated_by = username
        obj.save()
        return Response({'content': obj.content, 'updated_at': obj.updated_at.isoformat(), 'updated_by': obj.updated_by})
