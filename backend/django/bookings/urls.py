from django.urls import path
from .views import (
    BookingCreateView, MyBookingsView, AdminBookingsView,
    AdminBookingUpdateView, ResourceBookingsView, AdminDeleteUserBookingsView,
    BookingExtendView, BookingCancelView, BookingCancelExtensionView,
    NotificationListView, NotificationMarkReadView, NotificationClearView,
    DamageReportCreateView, DamageReportListView,
)

urlpatterns = [
    path('bookings', BookingCreateView.as_view()),
    path('bookings/my', MyBookingsView.as_view()),
    path('bookings/resources', ResourceBookingsView.as_view()),
    path('bookings/all', AdminBookingsView.as_view()),
    path('bookings/user/<str:username>', AdminDeleteUserBookingsView.as_view()),
    path('bookings/<int:booking_id>/extend', BookingExtendView.as_view()),
    path('bookings/<int:booking_id>/cancel', BookingCancelView.as_view()),
    path('bookings/<int:booking_id>/cancel-extension', BookingCancelExtensionView.as_view()),
    path('bookings/<int:booking_id>/status', AdminBookingUpdateView.as_view()),
    path('notifications', NotificationListView.as_view()),
    path('notifications/read', NotificationMarkReadView.as_view()),
    path('notifications/clear', NotificationClearView.as_view()),
    path('damage-reports', DamageReportListView.as_view()),
    path('damage-reports/create', DamageReportCreateView.as_view()),
]
