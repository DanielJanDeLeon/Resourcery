# Generated manually for privacy policy model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0017_termsandconditions'),
    ]

    operations = [
        migrations.CreateModel(
            name='PrivacyPolicy',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.JSONField(default=list)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('updated_by', models.CharField(default='admin', max_length=150)),
            ],
            options={
                'db_table': 'privacy_policy',
            },
        ),
    ]