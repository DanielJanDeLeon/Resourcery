from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['id', 'username', 'resource_id', 'resource_name', 'resource_type', 'date', 'return_date', 'time', 'end_time', 'status', 'is_extension', 'is_update', 'original_return_date', 'quantity_requested', 'created_at']
        read_only_fields = ['id', 'username', 'status', 'created_at']


class CreateBookingSerializer(serializers.Serializer):
    resource_id = serializers.IntegerField()
    resource_name = serializers.CharField(max_length=100)
    resource_type = serializers.CharField(max_length=80, default='')
    date = serializers.DateField()
    return_date = serializers.DateField(required=False, allow_null=True)
    time = serializers.TimeField()
    end_time = serializers.TimeField(required=False, allow_null=True)
    quantity_requested = serializers.IntegerField(default=1, min_value=1)
