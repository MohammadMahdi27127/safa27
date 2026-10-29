from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinValueValidator, MaxValueValidator
import jdatetime


class UserManager(BaseUserManager):
    """مدیریت ساخت کاربر با کد گروهی به جای نام کاربری معمولی"""
    def create_user(self, group_code, full_name, password=None, **extra_fields):
        if not group_code:
            raise ValueError('کد گروهی الزامی است.')
        user = self.model(group_code=str(group_code).strip(), full_name=full_name.strip(), **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, group_code, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_manager', True)
        return self.create_user(group_code, full_name, password, **extra_fields)


class Ring(models.Model):
    """مدل حلقه‌ها (۸ حلقه)"""
    name = models.CharField(max_length=100, verbose_name="نام حلقه")
    ring_number = models.PositiveSmallIntegerField(unique=True, verbose_name="شماره حلقه")
    score = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        verbose_name="امتیاز حلقه (۱ تا ۱۰)"
    )

    class Meta:
        verbose_name = "حلقه"
        verbose_name_plural = "حلقه‌ها"

    def __str__(self):
        return f"حلقه {self.ring_number} - {self.name}"


class Workgroup(models.Model):
    """مدل کارگروه‌ها (۱۰ کارگروه)"""
    name = models.CharField(max_length=100, verbose_name="نام کارگروه")
    leader = models.OneToOneField(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_workgroup',
        verbose_name="مسئول کارگروه"
    )
    score = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        verbose_name="امتیاز کارگروه (۱ تا ۱۰)"
    )

    class Meta:
        verbose_name = "کارگروه"
        verbose_name_plural = "کارگروه‌ها"

    def __str__(self):
        return self.name


class User(AbstractBaseUser, PermissionsMixin):
    """مدل کاربر با لاگین کد گروهی"""
    group_code = models.CharField(max_length=50, unique=True, verbose_name="کد گروهی")
    full_name = models.CharField(max_length=150, verbose_name="نام و نام خانوادگی")
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name="تصویر آواتار")

    # نقش‌ها و دسترسی‌ها (فیلدهای صریح دیتابیسی ۰ و ۱)
    is_manager = models.BooleanField(default=False, verbose_name="مربی (مدیر کل)")
    is_resolution_officer = models.BooleanField(default=False, verbose_name="مسئول مصوبات")
    is_workgroup_leader = models.BooleanField(default=False, verbose_name="مسئول کارگروه")

    # روابط تشکیلاتی
    ring = models.ForeignKey(Ring, on_delete=models.SET_NULL, null=True, blank=True, related_name='members', verbose_name="حلقه")
    workgroup = models.ForeignKey(Workgroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='members', verbose_name="کارگروه")

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'group_code'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        verbose_name = "کاربر"
        verbose_name_plural = "کاربران"

    def __str__(self):
        return f"{self.full_name} ({self.group_code})"


class WorkgroupMeeting(models.Model):
    """جلسات ثبت‌شده توسط مسئول کارگروه"""
    workgroup = models.ForeignKey(Workgroup, on_delete=models.CASCADE, related_name='meetings', verbose_name="کارگروه")
    meeting_shamsi_date = models.CharField(max_length=20, verbose_name="تاریخ شمسی جلسه")
    attendees_text = models.TextField(verbose_name="اعضای جلسه")
    descriptions_and_titles = models.TextField(verbose_name="مصوبات و عناوین جلسه")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت میلادی")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "جلسه کارگروه"
        verbose_name_plural = "جلسات کارگروه"


class Resolution(models.Model):
    """مصوبات صادرشده برای کارگروه‌ها توسط مسئول مصوبات"""
    workgroup = models.ForeignKey(Workgroup, on_delete=models.CASCADE, related_name='resolutions', verbose_name="کارگروه")
    title = models.CharField(max_length=255, verbose_name="عنوان مصوبه")
    is_completed = models.BooleanField(default=False, verbose_name="وضعیت انجام")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="زمان تکمیل")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "مصوبه"
        verbose_name_plural = "مصوبات"


# در بخش AnnouncementAndNotification در models.py:
class AnnouncementAndNotification(models.Model):
    NOTIFICATION_TYPES = (
        ('announcement', 'اعلان عمومی به کارگروه'),
        ('completion_alert', 'هشدار انجام مصوبه برای مسئول مصوبات'),
        ('manager_broadcast', 'پیام مستقیم مربی'),
    )
    msg_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES, default='announcement')
    workgroup = models.ForeignKey(Workgroup, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    ring = models.ForeignKey(Ring, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    target_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='direct_notifications')
    resolution = models.ForeignKey(Resolution, on_delete=models.SET_NULL, null=True, blank=True)
    text = models.TextField(verbose_name="متن پیام")
    is_read = models.BooleanField(default=False, verbose_name="خوانده شده")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "اعلان و نوتیفیکیشن"
        verbose_name_plural = "اعلانات و نوتیفیکیشن‌ها"


class WorkgroupFeedback(models.Model):
    """نظرات و پیشنهادات ارسالی مسئول کارگروه به مسئول مصوبات"""
    workgroup = models.ForeignKey(Workgroup, on_delete=models.CASCADE, related_name='feedbacks')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField(verbose_name="متن پیشنهاد")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "پیشنهاد کارگروه"
        verbose_name_plural = "پیشنهادات کارگروه"


class PersonalGrowthRecord(models.Model):
    """ثبت گزارش شبانه رشد فردی"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='growth_records')
    shamsi_date = models.CharField(max_length=20, verbose_name="تاریخ شمسی")
    exercise_hours = models.FloatField(default=0.0, verbose_name="ساعت ورزش")
    reading_pages = models.PositiveIntegerField(default=0, verbose_name="تعداد صفحه مطالعه")
    daily_responsibility = models.TextField(blank=True, verbose_name="مسئولیت امروز")
    skill_learning = models.TextField(blank=True, verbose_name="یادگیری مهارت")
    leisure_time = models.TextField(blank=True, verbose_name="اوقات فراغت")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "گزارش رشد فردی"
        verbose_name_plural = "گزارش‌های رشد فردی"


class GrowthCustomItem(models.Model):
    """آرشیو برنامه‌های ورزشی و کتب اضافه شده از طریق دکمه‌های ➕"""
    ITEM_TYPES = (
        ('exercise', 'برنامه ورزشی'),
        ('book', 'عنوان کتاب'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_items')
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES)
    title = models.CharField(max_length=255, verbose_name="عنوان")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "آیتم ذخیره‌شده رشد فردی"
        verbose_name_plural = "آیتم‌های ذخیره‌شده رشد فردی"


class PublicArchive(models.Model):
    """آرشیو عمومی فایل‌های فشرده ZIP"""
    CATEGORY_CHOICES = (
        ('video', 'ویدیو'),
        ('image', 'تصاویر'),
        ('audio', 'صوت‌ها'),
    )
    title = models.CharField(max_length=200, verbose_name="عنوان فایل")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name="دسته‌بندی")
    zip_file = models.FileField(upload_to='archives_zip/', verbose_name="فایل فشرده ZIP")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "آرشیو عمومی"
        verbose_name_plural = "آرشیو‌های عمومی"


class CustomForm(models.Model):
    """فرم‌های سفارشی قابل تنظیم توسط مسئولین کارگروه برای جمع‌آوری پاسخ‌های اعضاء"""
    EXPORT_INTERVAL_CHOICES = (
        (3, '۳ روز'),
        (5, '۵ روز'),
        (7, '۷ روز'),
    )
    
    creator = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='created_forms',
        verbose_name="سازنده فرم",
        limit_choices_to={'is_workgroup_leader': True}
    )
    workgroup = models.ForeignKey(
        Workgroup,
        on_delete=models.CASCADE,
        related_name='custom_forms',
        verbose_name="کارگروه"
    )
    title = models.CharField(max_length=255, verbose_name="عنوان فرم")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    
    # Export configuration
    export_interval_days = models.IntegerField(
        choices=EXPORT_INTERVAL_CHOICES,
        default=7,
        verbose_name="دوره تجمیع داده‌ها (روز)"
    )
    
    # Expiration settings
    expiration_date = models.DateTimeField(verbose_name="تاریخ انقضای فرم")
    
    # Dynamic fields schema as JSON
    fields_schema = models.JSONField(
        default=list,
        verbose_name="طرح فیلدهای فرم",
        help_text="لیستی از فیلدهای فرم که شامل type, label, required, order و ... است"
    )
    
    # Status management
    is_active = models.BooleanField(default=True, verbose_name="فعال بودن")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ به‌روزرسانی")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "فرم سفارشی"
        verbose_name_plural = "فرم‌های سفارشی"

    def __str__(self):
        return f"{self.title} - {self.workgroup.name}"

    def is_expired(self):
        """بررسی اینکه آیا فرم منقضی شده است"""
        from django.utils import timezone
        return timezone.now() > self.expiration_date

    def save(self, *args, **kwargs):
        """به‌روزرسانی خودکار وضعیت is_active بر اساس expiration_date"""
        from django.utils import timezone
        self.is_active = timezone.now() <= self.expiration_date
        super().save(*args, **kwargs)


class CustomFormResponse(models.Model):
    """پاسخ‌های کاربران به فرم‌های سفارشی"""
    form = models.ForeignKey(
        CustomForm,
        on_delete=models.CASCADE,
        related_name='responses',
        verbose_name="فرم"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='form_responses',
        verbose_name="کاربر"
    )
    
    # JSON field to store dynamic answers mapped to field names
    answers = models.JSONField(
        default=dict,
        verbose_name="پاسخ‌های کاربر",
        help_text="فیلدهای پاسخ‌ها با کلیدهای منطبق بر schema"
    )
    
    # Timestamp
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ارسال")

    class Meta:
        ordering = ['-submitted_at']
        verbose_name = "پاسخ فرم سفارشی"
        verbose_name_plural = "پاسخ‌های فرم‌های سفارشی"
        unique_together = [('form', 'user')]

    def __str__(self):
        return f"پاسخ {self.user.full_name} به فرم {self.form.title}"