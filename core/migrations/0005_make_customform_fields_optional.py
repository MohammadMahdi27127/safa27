# Generated migration - Makes workgroup and expiration_date optional in CustomForm

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_customform_customformresponse'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customform',
            name='workgroup',
            field=models.ForeignKey(
                blank=True,
                help_text='اختیاری - اگر خالی باشد، فرم برای همه کاربران قابل دسترس است',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='custom_forms',
                to='core.workgroup',
                verbose_name='کارگروه',
            ),
        ),
        migrations.AlterField(
            model_name='customform',
            name='expiration_date',
            field=models.DateTimeField(
                blank=True,
                help_text='اگر خالی باشد، فرم هیچ وقت منقضی نمی‌شود',
                null=True,
                verbose_name='تاریخ انقضای فرم',
            ),
        ),
    ]
