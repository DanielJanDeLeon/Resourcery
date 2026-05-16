from django.db import models


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending',          'Pending'),
        ('for_pickup',       'For Pick Up'),
        ('not_returned',     'Not Returned'),
        ('under_inspection', 'Under Inspection'),
        ('returned',         'Returned'),
        ('declined',         'Declined'),
        ('cancelled',        'Cancelled'),
        ('no_pickup',        'No Pick Up'),
    ]

    username = models.CharField(max_length=150)
    resource_id = models.IntegerField()
    resource_name = models.CharField(max_length=100)
    date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    resource_type = models.CharField(max_length=80, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_extension = models.BooleanField(default=False)
    is_update = models.BooleanField(default=False)
    original_return_date = models.DateField(null=True, blank=True)
    quantity_requested = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']

    def __str__(self):
        return f"Booking #{self.id} by {self.username} for {self.resource_name}"


class DamageReport(models.Model):
    SEVERITY_CHOICES = [
        ('minor',    'Minor'),
        ('moderate', 'Moderate'),
        ('severe',   'Severe'),
    ]

    booking_id      = models.IntegerField()
    resource_id     = models.IntegerField(default=0)
    resource_name   = models.CharField(max_length=100)
    username        = models.CharField(max_length=150)
    description     = models.TextField()
    severity        = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='minor')
    reported_by     = models.CharField(max_length=150)
    quantity_damaged = models.IntegerField(default=1)
    resolved        = models.BooleanField(default=False)
    resolved_at     = models.DateTimeField(null=True, blank=True)
    resolved_by     = models.CharField(max_length=150, blank=True, default='')
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'damage_reports'
        ordering = ['-created_at']

    def __str__(self):
        return f"Damage Report #{self.id} — {self.resource_name} by {self.username}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('new_booking',       'New Booking'),
        ('booking_update',    'Booking Update'),
        ('booking_extension', 'Booking Extension'),
        ('booking_approved',  'Booking Approved'),
        ('booking_declined',  'Booking Declined'),
        ('booking_cancelled', 'Booking Cancelled'),
        ('booking_picked_up', 'Booking Picked Up'),
        ('booking_no_pickup', 'Booking No Pick Up'),
        ('booking_reminder',  'Booking Reminder'),
        ('damage_report',     'Damage Report'),
    ]

    recipient = models.CharField(max_length=150)
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    booking_id = models.IntegerField()
    resource_name = models.CharField(max_length=100)
    username = models.CharField(max_length=150)
    date = models.CharField(max_length=50)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']


class TermsAndConditions(models.Model):
    content = models.JSONField(default=list)  # list of {title, body}
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=150, default='admin')

    class Meta:
        db_table = 'terms_and_conditions'

    def __str__(self):
        return f"Terms (updated {self.updated_at})"


class PrivacyPolicy(models.Model):
    content = models.JSONField(default=list)  # list of {title, body}
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=150, default='admin')

    class Meta:
        db_table = 'privacy_policy'

    def __str__(self):
        return f"Privacy Policy (updated {self.updated_at})"
