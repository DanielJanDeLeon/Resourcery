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
    """Fetch the total quantity of a resource from PHP service."""
    import requests, os
    PHP_API = os.environ.get('PHP_API_URL', 'http://php:80')
    try:
        r = requests.get(f'{PHP_API}/resources/{resource_id}', timeout=3)
        return r.json().get('quantity', 1)
    except Exception:
        return 1


def _booked_quantity(resource_id, pickup, ret, exclude_id=None):
    """Sum of quantity_requested for active overlapping bookings."""
    qs = Booking.objects.filter(
        resource_id=resource_id,
        status__in=['for_pickup', 'not_returned', 'pending'],
    ).filter(date__lte=ret, return_date__gte=pickup)
    if not qs.exists():
        qs = Booking.objects.filter(
            resource_id=resource_id,
            status__in=['for_pickup', 'not_returned', 'pending'],
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
        if new_status not in ['for_pickup', 'declined', 'pending', 'not_returned', 'returned']:
            return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

        if new_status == 'for_pickup':
            # Check for date conflicts with already for_pickup/not_returned bookings
            pickup_date = booking.date
            ret_date = booking.return_date or booking.date
            conflict = Booking.objects.filter(
                resource_id=booking.resource_id,
                status__in=['for_pickup', 'not_returned'],
            ).filter(date__lte=ret_date, return_date__gte=pickup_date).exclude(id=booking_id).first()

            if not conflict:
                conflict = Booking.objects.filter(
                    resource_id=booking.resource_id,
                    status__in=['for_pickup', 'not_returned'],
                    return_date__isnull=True,
                    date__range=[pickup_date, ret_date],
                ).exclude(id=booking_id).first()

            if conflict:
                return Response(
                    {
                        'error': f'Cannot approve: Dates selected already booked by {conflict.username}',
                        'conflict_booking_id': conflict.id,
                        'conflict_username': conflict.username,
                    },
                    status=status.HTTP_409_CONFLICT
                )

            # Auto-decline all other pending bookings for the same resource/dates
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

            for b in overlapping_pending:
                b.status = 'declined'
                b.save()
                _notify_resident(b, 'booking_declined')

        booking.status = new_status
        if new_status == 'for_pickup':
            booking.is_extension = False
            booking.is_update = False
        booking.save()

        if new_status == 'for_pickup':
            _notify_resident(booking, 'booking_approved')
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


# ── Damage Report endpoints ───────────────────────────────────────────────────

class DamageReportCreateView(APIView):
    """POST /damage-reports — admin files a damage report."""

    @require_auth(roles=['ROLE_ADMIN'])
    def post(self, request):
        reported_by = request.jwt_payload['sub']
        booking_id   = request.data.get('booking_id')
        resource_name = request.data.get('resource_name', '')
        username     = request.data.get('username', '')
        description  = request.data.get('description', '').strip()
        severity     = request.data.get('severity', 'minor')

        if not description:
            return Response({'error': 'Description is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if severity not in ['minor', 'moderate', 'severe']:
            return Response({'error': 'Invalid severity.'}, status=status.HTTP_400_BAD_REQUEST)

        report = DamageReport.objects.create(
            booking_id=booking_id,
            resource_name=resource_name,
            username=username,
            description=description,
            severity=severity,
            reported_by=reported_by,
        )

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
            'resource_name': report.resource_name,
            'username': report.username,
            'description': report.description,
            'severity': report.severity,
            'reported_by': report.reported_by,
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

        data = [
            {
                'id': r.id,
                'booking_id': r.booking_id,
                'resource_name': r.resource_name,
                'username': r.username,
                'description': r.description,
                'severity': r.severity,
                'reported_by': r.reported_by,
                'created_at': r.created_at.isoformat(),
            }
            for r in reports
        ]
        return Response(data)
