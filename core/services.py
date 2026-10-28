import os
import logging
import csv
import urllib.request
import io
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)

# لینک پیش‌فرض CSV (در صورت عدم تنظیم متغیر محیطی)
DEFAULT_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS1WFrSNKyyvQcgOGzxSZ6o9w-Ci1brshZgEr8RxZ5t6uI2h8I1KYpfldeE5kf4TVpMndzUp9w5fi6J/pub?gid=643360414&single=true&output=csv"

def normalize_code(code):
    """
    نرمال‌سازی کد کاربر:
    1. تبدیل اعداد فارسی و عربی به انگلیسی
    2. حذف فاصله‌های اضافی و کاراکترهای پنهان
    3. یکسان‌سازی کاراکترهای ی و ک
    """
    if code is None:
        return ""
    
    code = str(code).strip()
    
    # نقشه تبدیل اعداد فارسی/عربی به انگلیسی
    digits_map = {
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    }
    
    for k, v in digits_map.items():
        code = code.replace(k, v)
    
    # یکسان‌سازی ی و ک
    code = code.replace('ی', 'ی').replace('ي', 'ی').replace('ک', 'ک').replace('ك', 'ک')
    
    return code

def get_all_sheet_matrix():
    """
    دریافت ماتریس داده‌ها از لینک CSV گوگل‌شیت با سیستم کشینگ
    """
    cache_key = "google_sheet_all_matrix"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    csv_url = os.environ.get("GOOGLE_SHEET_CSV_URL", DEFAULT_CSV_URL)

    try:
        # فراخوانی زنده لینک CSV
        logger.info(f"Fetching live CSV from Google Sheets...")
        with urllib.request.urlopen(csv_url, timeout=15) as response:
            content = response.read().decode('utf-8')
            
        # پارس کردن محتوا به صورت ماتریس دو بعدی
        f = io.StringIO(content)
        reader = csv.reader(f)
        all_rows = list(reader)
        
        if not all_rows:
            logger.error("Fetched CSV content is empty.")
            return None

        # ذخیره در کش برای ۱۰ دقیقه (۶۰۰ ثانیه)
        cache.set(cache_key, all_rows, timeout=600)
        logger.info("Sheet data cached for 10 minutes.")
        return all_rows

    except Exception as e:
        logger.error(f"Error fetching/parsing CSV from Google Sheets: {str(e)}", exc_info=True)
        return None

def get_user_sheet_info_by_code(group_code: str):
    if not group_code:
        return {'attendance_rate': None, 'last_10_columns': [], 'found': False}

    target_code = normalize_code(group_code)
    all_rows = get_all_sheet_matrix()
    
    if not all_rows:
        logger.error("Failed to fetch sheet matrix or matrix is empty.")
        return {'attendance_rate': None, 'last_10_columns': [], 'found': False}

    if len(all_rows) < 6:
        logger.warning(f"Sheet matrix has insufficient rows: {len(all_rows)}")
        return {'attendance_rate': None, 'last_10_columns': [], 'found': False}

    programs = all_rows[0]
    dates = all_rows[1]

    target_row = None
    # لاگ برای عیب‌یابی تطابق
    logger.debug(f"Searching for normalized code: '{target_code}'")
    
    for idx, row in enumerate(all_rows[5:]):
        if len(row) > 0:
            current_row_code = normalize_code(row[0])
            if current_row_code == target_code:
                target_row = row
                logger.info(f"User found at row {idx + 6}")
                break

    if not target_row:
        logger.info(f"User with code '{target_code}' not found in sheet.")
        return {'attendance_rate': None, 'last_10_columns': [], 'found': False}

    valid_records = []
    total_present = 0
    total_sessions = 0

    max_cols = min(len(programs), len(target_row))
    for col_idx in range(1, max_cols):
        prog_name = programs[col_idx].strip()
        date_val = dates[col_idx].strip() if col_idx < len(dates) else ""
        val = target_row[col_idx].strip()

        if val in ['0', '1']:
            total_sessions += 1
            if val == '1':
                total_present += 1

            label = f"{prog_name} ({date_val})" if date_val else prog_name
            valid_records.append({
                'title': label if label else f"برنامه {col_idx}",
                'value': 'حاضر' if val == '1' else 'غایب',
                'status': True if val == '1' else False
            })

    if total_sessions > 0:
        calc_rate = round((total_present / total_sessions) * 100)
        attendance_rate = f"{calc_rate}%"
    else:
        attendance_rate = '۰%'

    last_10 = valid_records[-10:] if len(valid_records) >= 10 else valid_records
    last_10.reverse()

    return {
        'attendance_rate': attendance_rate,
        'last_10_columns': last_10,
        'found': True
    }

def get_user_sheet_info(user_or_code):
    if hasattr(user_or_code, 'group_code'):
        return get_user_sheet_info_by_code(user_or_code.group_code)
    return get_user_sheet_info_by_code(user_or_code)