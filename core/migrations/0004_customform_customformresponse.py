# Generated migration for CustomForm and CustomFormResponse models

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_announcementandnotification_ring_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='CustomForm',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='عنوان فرم')),
                ('description', models.TextField(blank=True, null=True, verbose_name='توضیحات')),
                ('export_interval_days', models.IntegerField(choices=[(3, '۳ روز'), (5, '۵ روز'), (7, '۷ روز')], default=7, verbose_name='دوره تجمیع داده‌ها (روز)')),
                ('expiration_date', models.DateTimeField(verbose_name='تاریخ انقضای فرم')),
                ('fields_schema', models.JSONField(default=list, help_text='لیستی از فیلدهای فرم که شامل type, label, required, order و ... است', verbose_name='طرح فیلدهای فرم')),
                ('is_active', models.BooleanField(default=True, verbose_name='فعال بودن')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='تاریخ به‌روزرسانی')),
                ('creator', models.ForeignKey(limit_choices_to={'is_workgroup_leader': True}, on_delete=django.db.models.deletion.CASCADE, related_name='created_forms', to=settings.AUTH_USER_MODEL, verbose_name='سازنده فرم')),
                ('workgroup', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='custom_forms', to='core.workgroup', verbose_name='کارگروه')),
            ],
            options={
                'verbose_name': 'فرم سفارشی',
                'verbose_name_plural': 'فرم‌های سفارشی',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='CustomFormResponse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('answers', models.JSONField(default=dict, help_text='فیلدهای پاسخ‌ها با کلیدهای منطبق بر schema', verbose_name='پاسخ‌های کاربر')),
                ('submitted_at', models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ارسال')),
                ('form', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='responses', to='core.customform', verbose_name='فرم')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='form_responses', to=settings.AUTH_USER_MODEL, verbose_name='کاربر')),
            ],
            options={
                'verbose_name': 'پاسخ فرم سفارشی',
                'verbose_name_plural': 'پاسخ‌های فرم‌های سفارشی',
                'ordering': ['-submitted_at'],
                'unique_together': {('form', 'user')},
            },
        ),
    ]
