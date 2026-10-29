"""
توابع کمکی برای تقسیم‌بندی دوره‌های هفتگی (دوره یکشنبه و دوره پنج‌شنبه)
"""
from datetime import datetime, timedelta
from typing import Tuple, Literal
import jdatetime


def get_period_dates(
    period: Literal['sunday', 'thursday'],
    reference_date: datetime | None = None
) -> Tuple[datetime, datetime, str, str]:
    """
    محاسبه تاریخ‌های شروع و پایان یک دوره گزارش‌دهی بر اساس نوع دوره.
    
    دوره یکشنبه (۳ روزه): جمعه تا یکشنبه (آخرین جمعه تا آخرین یکشنبه)
    دوره پنج‌شنبه (۴ روزه): دوشنبه تا پنج‌شنبه (آخرین دوشنبه تا آخرین پنج‌شنبه)
    
    Args:
        period: 'sunday' یا 'thursday'
        reference_date: تاریخ مرجع (پیش‌فرض: امروز)
    
    Returns:
        tuple: (start_datetime, end_datetime, shamsi_start, shamsi_end)
    """
    if reference_date is None:
        reference_date = datetime.now()
    
    # استخراج روز هفته (0=دوشنبه تا 6=یکشنبه در Python)
    weekday = reference_date.weekday()
    
    if period == 'sunday':
        # دوره یکشنبه: جمعه (4) تا یکشنبه (6)
        # محاسبه آخرین جمعه (روز 4)
        if weekday >= 4:
            # اگر امروز جمعه (4) یا بعدتر (شنبه 5 یا یکشنبه 6)
            days_back = weekday - 4
            start_date = reference_date - timedelta(days=days_back)
        else:
            # اگر امروز قبل از جمعه (دوشنبه تا پنج‌شنبه: 0-3)
            # آخرین جمعه هفته قبل است
            start_date = reference_date - timedelta(days=3 + weekday)
        
        end_date = start_date + timedelta(days=2)  # جمعه + ۲ روز = یکشنبه
    
    elif period == 'thursday':
        # دوره پنج‌شنبه: دوشنبه (0) تا پنج‌شنبه (4)
        # محاسبه آخرین دوشنبه (روز 0)
        if weekday >= 0 and weekday <= 4:
            # اگر ما در دوره پنج‌شنبه هستیم (دوشنبه تا پنج‌شنبه: 0-4)
            start_date = reference_date - timedelta(days=weekday)
        else:
            # اگر امروز جمعه (5) یا شنبه (6)
            # آخرین دوشنبه هفته قبل است
            start_date = reference_date - timedelta(days=(weekday - 0 + 2))  # 5-0+2=7, 6-0+2=8
        
        end_date = start_date + timedelta(days=4)  # دوشنبه + ۴ روز = پنج‌شنبه
    
    else:
        raise ValueError("period باید 'sunday' یا 'thursday' باشد")
    
    # تبدیل به شمسی برای نمایش
    shamsi_start = jdatetime.date.fromgregorian(date=start_date.date()).strftime('%Y/%m/%d')
    shamsi_end = jdatetime.date.fromgregorian(date=end_date.date()).strftime('%Y/%m/%d')
    
    # تنظیم ساعات برای شروع (00:00) و پایان (23:59:59)
    start_datetime = datetime.combine(start_date.date(), datetime.min.time())
    end_datetime = datetime.combine(end_date.date(), datetime.max.time())
    
    return start_datetime, end_datetime, shamsi_start, shamsi_end


def get_current_period() -> Literal['sunday', 'thursday']:
    """
    بازگشت دوره فعال فعلی بر اساس روز هفته.
    
    دوشنبه تا پنج‌شنبه: دوره پنج‌شنبه
    جمعه تا یکشنبه: دوره یکشنبه
    
    Returns:
        'sunday' یا 'thursday'
    """
    today = datetime.now()
    weekday = today.weekday()
    
    if weekday >= 5:  # جمعه (5) یا شنبه (6)
        return 'sunday'
    elif weekday == 6:  # یکشنبه (6)
        return 'sunday'
    else:  # دوشنبه تا پنج‌شنبه (0 تا 4)
        return 'thursday'


def get_period_label(period: Literal['sunday', 'thursday']) -> str:
    """
    بازگشت برچسب فارسی برای یک دوره.
    
    Args:
        period: 'sunday' یا 'thursday'
    
    Returns:
        برچسب فارسی
    """
    if period == 'sunday':
        return 'جمعه تا یکشنبه (۳ روزه)'
    elif period == 'thursday':
        return 'دوشنبه تا پنج‌شنبه (۴ روزه)'
    else:
        return ''


def get_period_days(period: Literal['sunday', 'thursday']) -> int:
    """
    بازگشت تعداد روزهای یک دوره.
    
    Args:
        period: 'sunday' یا 'thursday'
    
    Returns:
        تعداد روزها (3 یا 4)
    """
    if period == 'sunday':
        return 3
    elif period == 'thursday':
        return 4
    else:
        raise ValueError("period باید 'sunday' یا 'thursday' باشد")
