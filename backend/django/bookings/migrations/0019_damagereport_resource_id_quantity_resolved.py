from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0018_privacypolicy'),
    ]

    operations = [
        migrations.AddField(
            model_name='damagereport',
            name='resource_id',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='damagereport',
            name='quantity_damaged',
            field=models.IntegerField(default=1),
        ),
        migrations.AddField(
            model_name='damagereport',
            name='resolved',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='damagereport',
            name='resolved_at',
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='damagereport',
            name='resolved_by',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
    ]
