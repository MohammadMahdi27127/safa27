import gspread
from django.core.cache import cache

SHEET_ID = "1LFe8XI4vdu_-LfMQEPkRxqewg5_BX3BJo-f7NPwmcA4"
WORKSHEET_GID = 643360414

def get_sheet_client():
    return gspread.service_account(filename="credentials.json")

def get_all_sheet_matrix():
    cache_key = "google_sheet_all_matrix"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        client = get_sheet_client()
        sh = client.open_by_key(SHEET_ID)
        sheet = sh.get_worksheet_by_id(WORKSHEET_GID)
        if not sheet:
            sheet = sh.sheet1
        all_rows = sheet.get_all_values()
        cache.set(cache_key, all_rows, timeout=600)  # نگهداری ۱۰ دقیقه در رم
        return all_rows
    except Exception as e:
        print(f"Sheet Fetch Error: {e}")
        return None

def get_user_sheet_info_by_code(group_code: str):
    if not group_code:
        return {'attendance_rate': None, 'last_10_columns': [], 'found': False}

    target_code = str(group_code).strip()
    all_rows = get_all_sheet_matrix()
    if not all_rows or len(all_rows) < 6:
        return {'attendance_rate': None, 'last_10_columns': [], 'found': False}

    programs = all_rows[0]
    dates = all_rows[1]

    target_row = None
    for row in all_rows[5:]:
        if len(row) > 0 and str(row[0]).strip() == target_code:
            target_row = row
            break

    if not target_row:
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