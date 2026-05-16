from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0019_damagereport_resource_id_quantity_resolved'),
    ]

    operations = [
        migrations.AlterField(
            model_name='booking',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending',          'Pending'),
                    ('for_pickup',       'For Pick Up'),
                    ('not_returned',     'Not Returned'),
                    ('under_inspection', 'Under Inspection'),
                    ('returned',         'Returned'),
                    ('declined',         'Declined'),
                    ('cancelled',        'Cancelled'),
                    ('no_pickup',        'No Pick Up'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]
