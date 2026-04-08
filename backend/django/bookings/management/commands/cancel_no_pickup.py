from django.core.management.base import BaseCommand
from django.utils import timezone
from bookings.models import Booking, Notification


class Command(BaseCommand):
    help = 'Cancel for_pickup bookings where the pickup date has passed. Also send reminders for tomorrow.'

    def handle(self, *args, **options):
        today = timezone.now().date()
        tomorrow = today + timezone.timedelta(days=1)

        # ── Auto-cancel overdue for_pickup bookings ───────────────────────────
        overdue = Booking.objects.filter(status='for_pickup', date__lt=today)
        cancelled_count = 0
        for booking in overdue:
            booking.status = 'no_pickup'
            booking.save()
            date_label = f"{booking.date} – {booking.return_date}" if booking.return_date else str(booking.date)
            Notification.objects.create(
                recipient=booking.username, type='booking_no_pickup',
                booking_id=booking.id, resource_name=booking.resource_name,
                username=booking.username, date=date_label,
            )
            Notification.objects.create(
                recipient='admin', type='booking_no_pickup',
                booking_id=booking.id, resource_name=booking.resource_name,
                username=booking.username, date=date_label,
            )
            cancelled_count += 1

        # ── Send pickup reminders for tomorrow ────────────────────────────────
        upcoming = Booking.objects.filter(status='for_pickup', date=tomorrow)
        reminder_count = 0
        for booking in upcoming:
            # Only send if no reminder was already sent today
            already_sent = Notification.objects.filter(
                recipient=booking.username,
                type='booking_reminder',
                booking_id=booking.id,
            ).exists()
            if not already_sent:
                date_label = f"{booking.date} – {booking.return_date}" if booking.return_date else str(booking.date)
                Notification.objects.create(
                    recipient=booking.username, type='booking_reminder',
                    booking_id=booking.id, resource_name=booking.resource_name,
                    username=booking.username, date=date_label,
                )
                reminder_count += 1

        self.stdout.write(
            f'[cancel_no_pickup] Cancelled {cancelled_count} overdue booking(s). '
            f'Sent {reminder_count} pickup reminder(s).'
        )
