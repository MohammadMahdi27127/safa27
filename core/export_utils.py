"""
توابع صادرات داده‌های فرم‌های سفارشی و آمار مهارت‌های کارگروه به فایل‌های Excel
"""
from io import BytesIO
from datetime import datetime, timedelta
from django.utils import timezone
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from .models import CustomForm, CustomFormResponse


def export_form_responses_to_excel_with_date_range(form: CustomForm, responses, days_back: int) -> tuple:
    """
    صادرات پاسخ‌های فرم به فایل Excel برای بازه زمانی مشخص
    
    Args:
        form: شی CustomForm
        responses: QuerySet یا لیست CustomFormResponse filtered by date
        days_back: تعداد روزهای گذشته
    
    Returns:
        tuple: (bytes محتوا، نام فایل)
    """
    wb = Workbook()
    ws = wb.active
    ws.title = 'پاسخ‌های فرم'
    
    # تنظیم جهت متن RTL
    ws.sheet_view.rightToLeft = True
    
    # استایل سرتیتر
    header_font = Font(bold=True, color='FFFFFF', size=12)
    header_fill = PatternFill(start_color='4472C4', end_color='4472C4', fill_type='solid')
    header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    right_alignment = Alignment(horizontal='right', vertical='center', wrap_text=True)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # عنوان فرم
    ws.merge_cells('A1:E1')
    title_cell = ws['A1']
    title_cell.value = f"فرم: {form.title}"
    title_cell.font = Font(bold=True, size=14)
    title_cell.alignment = Alignment(horizontal='right')
    
    # اطلاعات فرم
    ws.merge_cells('A2:E2')
    info_cell = ws['A2']
    info_cell.value = f"دوره: {days_back} روز اخیر | تاریخ صادرات: {datetime.now().strftime('%Y/%m/%d %H:%M')}"
    info_cell.font = Font(size=10, italic=True)
    info_cell.alignment = Alignment(horizontal='right')
    
    ws.append([])  # سطر خالی
    
    # سرتیتر‌های ستون‌ها: نام، کد گروهی، تاریخ ارسال، و فیلدهای دینامیک
    headers = ['تاریخ ارسال', 'کد گروهی', 'نام کامل']
    
    # افزودن سرتیتر‌های فیلدهای دینامیک
    if form.fields_schema and len(form.fields_schema) > 0:
        for field in form.fields_schema:
            field_label = field.get('label', field.get('name', 'فیلد نامعلوم'))
            headers.append(field_label)
    
    ws.append(headers)
    
    # استایل سرتیتر
    for cell in ws[4]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = border
    
    # پر کردن داده‌ها
    row_num = 5
    for response in responses:
        try:
            shamsi_date = response.submitted_at.strftime('%Y/%m/%d %H:%M')
            row_data = [
                shamsi_date,
                response.user.group_code or '---',
                response.user.full_name or 'نام نامشخص'
            ]
            
            # افزودن پاسخ‌های دینامیک
            if form.fields_schema and len(form.fields_schema) > 0:
                for field in form.fields_schema:
                    field_name = field.get('name', '')
                    answer = response.answers.get(field_name, '') if response.answers else ''
                    
                    # تبدیل لیست‌ها به رشته
                    if isinstance(answer, list):
                        answer = '، '.join(str(a) for a in answer)
                    
                    row_data.append(str(answer) if answer else '')
            
            ws.append(row_data)
            
            # استایل سطرها
            for cell in ws[row_num]:
                cell.alignment = right_alignment
                cell.border = border
            
            row_num += 1
        except Exception as e:
            print(f'[WARNING] Error processing response {response.id}: {str(e)}')
            continue
    
    # تنظیم عرض ستون‌ها
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width
    
    # ذخیره در حافظه
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    # نام فایل
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{form.title}_responses_{days_back}days_{timestamp}.xlsx"
    
    return output.getvalue(), filename


def export_form_responses_to_excel(form: CustomForm) -> tuple:
    """
    صادرات پاسخ‌های فرم به فایل Excel
    
    Args:
        form: شی CustomForm
    
    Returns:
        tuple: (bytes محتوا، نام فایل)
    """
    wb = Workbook()
    ws = wb.active
    ws.title = 'پاسخ‌ها'
    
    # تنظیم جهت متن RTL
    ws.sheet_view.rightToLeft = True
    
    # استایل سرتیتر
    header_font = Font(bold=True, color='FFFFFF', size=12)
    header_fill = PatternFill(start_color='4472C4', end_color='4472C4', fill_type='solid')
    header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # عنوان فرم
    ws.merge_cells('A1:F1')
    title_cell = ws['A1']
    title_cell.value = f"فرم: {form.title}"
    title_cell.font = Font(bold=True, size=14)
    title_cell.alignment = Alignment(horizontal='right')
    
    # اطلاعات فرم
    ws.merge_cells('A2:F2')
    info_cell = ws['A2']
    export_interval = dict(CustomForm.EXPORT_INTERVAL_CHOICES)[form.export_interval_days]
    info_cell.value = f"دوره تجمیع: {export_interval} | تاریخ انقضا: {form.expiration_date.strftime('%Y/%m/%d')}"
    info_cell.font = Font(size=10, italic=True)
    info_cell.alignment = Alignment(horizontal='right')
    
    ws.append([])  # سطر خالی
    
    # سرتیتر‌های ستون‌ها
    headers = ['تاریخ ارسال', 'کد گروهی', 'نام کامل']
    
    # افزودن سرتیتر‌های فیلدهای دینامیک
    for field in form.fields_schema:
        headers.append(field.get('label', field.get('name', 'فیلد نامعلوم')))
    
    ws.append(headers)
    
    # استایل سرتیتر
    for cell in ws[4]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = border
    
    # دریافت پاسخ‌های فرم
    responses = CustomFormResponse.objects.filter(form=form).select_related('user')
    
    # اگر export_interval_days تنظیم شده است، فقط پاسخ‌های دوره کنونی را نشان بده
    now = timezone.now()
    days_ago = now - timedelta(days=form.export_interval_days)
    
    # پر کردن داده‌ها
    row_num = 5
    for response in responses:
        # اگر export_interval فیلتر شود (optional)
        # if response.submitted_at < days_ago:
        #     continue
        
        shamsi_date = response.submitted_at.strftime('%Y/%m/%d %H:%M')
        row_data = [
            shamsi_date,
            response.user.group_code,
            response.user.full_name
        ]
        
        # افزودن پاسخ‌های دینامیک
        for field in form.fields_schema:
            field_name = field.get('name', '')
            answer = response.answers.get(field_name, '')
            
            # تبدیل لیست‌ها به رشته
            if isinstance(answer, list):
                answer = '، '.join(str(a) for a in answer)
            
            row_data.append(str(answer) if answer else '')
        
        ws.append(row_data)
        
        # استایل سطرها
        for cell in ws[row_num]:
            cell.alignment = Alignment(horizontal='right', vertical='center', wrap_text=True)
            cell.border = border
        
        row_num += 1
    
    # تنظیم عرض ستون‌ها
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width
    
    # ذخیره در حافظه
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    # نام فایل
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{form.title}_{timestamp}.xlsx"
    
    return output.getvalue(), filename



def export_skills_to_excel(workgroup, period: str, reference_date=None) -> tuple:
    """
    صادرات مهارت‌های اعضاء کارگروه به فایل Excel برای یک دوره خاص.
    
    فقط چهار ستون: نام کامل، کد گروهی، تاریخ ثبت، و مهارت‌های ثبت‌شده
    
    Args:
        workgroup: شی Workgroup
        period: 'sunday' یا 'thursday'
        reference_date: تاریخ مرجع (پیش‌فرض: امروز)
    
    Returns:
        tuple: (bytes محتوا، نام فایل)
    """
    from django.utils import timezone
    from .date_utils import get_period_dates, get_period_label
    from .models import PersonalGrowthRecord, User
    import jdatetime

    # محاسبه تاریخ‌های دوره
    start_datetime, end_datetime, shamsi_start, shamsi_end = get_period_dates(
        period=period,
        reference_date=reference_date
    )

    # دریافت اعضاء کارگروه
    members = User.objects.filter(workgroup=workgroup).order_by('full_name')

    # ایجاد Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = 'صادرات مهارت‌ها'

    # تنظیم جهت RTL
    ws.sheet_view.rightToLeft = True

    # استایل‌های سرتیتر
    header_font = Font(bold=True, color='FFFFFF', size=12)
    header_fill = PatternFill(start_color='1F4E78', end_color='1F4E78', fill_type='solid')
    header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    right_alignment = Alignment(horizontal='right', vertical='center', wrap_text=True)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )

    # عنوان فایل
    ws.merge_cells('A1:D1')
    title_cell = ws['A1']
    title_cell.value = f"صادرات مهارت‌های {workgroup.name}"
    title_cell.font = Font(bold=True, size=14, color='FFFFFF')
    title_cell.fill = PatternFill(start_color='203864', end_color='203864', fill_type='solid')
    title_cell.alignment = Alignment(horizontal='right')

    # اطلاعات دوره
    ws.merge_cells('A2:D2')
    info_cell = ws['A2']
    period_label = get_period_label(period)
    info_cell.value = f"دوره: {period_label} | از {shamsi_start} تا {shamsi_end}"
    info_cell.font = Font(size=10, italic=True)
    info_cell.alignment = Alignment(horizontal='right')

    ws.append([])  # سطر خالی

    # سرتیتر‌های ستون‌ها (فقط ۴ ستون)
    headers = [
        'نام کامل',           # Member Full Name
        'کد گروهی',           # Group Code
        'روز و تاریخ ثبت',    # Submission Date
        'فیلد مهارت'           # Skills Input
    ]

    ws.append(headers)

    # استایل سرتیتر
    for cell in ws[4]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = border

    # پر کردن داده‌های اعضاء
    row_num = 5
    for member in members:
        try:
            # دریافت رکوردهای رشد فردی در این دوره
            records = PersonalGrowthRecord.objects.filter(
                user=member,
                created_at__gte=start_datetime,
                created_at__lte=end_datetime
            ).order_by('-created_at')

            # اگر کاربر رکوردی دارد، شامل کردن آن‌ها؛ در غیر این صورت خط خالی
            if records.exists():
                for record in records:
                    try:
                        shamsi_date = record.created_at.strftime('%Y/%m/%d')
                        # ✅ استخراج مهارت‌های ثبت‌شده با safety handling برای null/empty
                        skills_input = (record.skill_learning or '').strip() if record.skill_learning else ''

                        row_data = [
                            member.full_name or 'نام نامشخص',
                            member.group_code or '---',
                            shamsi_date,
                            skills_input
                        ]

                        ws.append(row_data)

                        # استایل سطرها
                        for cell in ws[row_num]:
                            cell.alignment = right_alignment
                            cell.border = border

                        row_num += 1
                    except Exception as record_err:
                        # Log اما ادامه دهید
                        print(f'[WARNING] Error processing record {record.id}: {str(record_err)}')
                        continue
            else:
                # افزودن خط خالی برای اعضاء بدون ثبت
                try:
                    row_data = [
                        member.full_name or 'نام نامشخص',
                        member.group_code or '---',
                        '',
                        ''
                    ]

                    ws.append(row_data)

                    # استایل سطرها
                    for cell in ws[row_num]:
                        cell.alignment = right_alignment
                        cell.border = border

                    row_num += 1
                except Exception as e:
                    print(f'[WARNING] Error adding empty row for member {member.id}: {str(e)}')
                    continue
        except Exception as member_err:
            print(f'[WARNING] Error processing member {member.id}: {str(member_err)}')
            continue

    # تنظیم عرض ستون‌ها
    column_widths = [20, 15, 20, 30]
    for idx, width in enumerate(column_widths, 1):
        col_letter = chr(64 + idx)  # A=65, B=66, etc.
        ws.column_dimensions[col_letter].width = width

    # خط خلاصه در انتهای فایل
    ws.append([])
    ws.append([f'جمع کل اعضاء: {members.count()}'])

    # ذخیره در حافظه
    output = BytesIO()
    wb.save(output)
    output.seek(0)

    # نام فایل
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    period_text = 'Sunday_3days' if period == 'sunday' else 'Thursday_4days'
    filename = f"Skills_{workgroup.name}_{period_text}_{timestamp}.xlsx"

    return output.getvalue(), filename



def export_skills_to_excel_global(period: str, reference_date=None) -> tuple:
    """
    ✅ صادرات مهارت‌های تمام اعضا (همگانی) به فایل Excel برای یک دوره خاص.
    
    تفاوت از export_skills_to_excel: این تابع همه کاربران را شامل می‌کند، نه فقط اعضاء یک کارگروه
    
    Args:
        period: 'sunday' یا 'thursday'
        reference_date: تاریخ مرجع (پیش‌فرض: امروز)
    
    Returns:
        tuple: (bytes محتوا، نام فایل)
    """
    from django.utils import timezone
    from .date_utils import get_period_dates, get_period_label
    from .models import PersonalGrowthRecord, User
    import jdatetime

    # محاسبه تاریخ‌های دوره
    start_datetime, end_datetime, shamsi_start, shamsi_end = get_period_dates(
        period=period,
        reference_date=reference_date
    )

    # ✅ دریافت تمام کاربران (بدون محدودیت کارگروه)
    members = User.objects.all().order_by('full_name')

    # ایجاد Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = 'صادرات مهارت‌ها'

    # تنظیم جهت RTL
    ws.sheet_view.rightToLeft = True

    # استایل‌های سرتیتر
    header_font = Font(bold=True, color='FFFFFF', size=12)
    header_fill = PatternFill(start_color='1F4E78', end_color='1F4E78', fill_type='solid')
    header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    right_alignment = Alignment(horizontal='right', vertical='center', wrap_text=True)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )

    # عنوان فایل
    ws.merge_cells('A1:D1')
    title_cell = ws['A1']
    title_cell.value = "✅ صادرات مهارت‌های تمام اعضا (همگانی)"
    title_cell.font = Font(bold=True, size=14, color='FFFFFF')
    title_cell.fill = PatternFill(start_color='203864', end_color='203864', fill_type='solid')
    title_cell.alignment = Alignment(horizontal='right')

    # اطلاعات دوره
    ws.merge_cells('A2:D2')
    info_cell = ws['A2']
    period_label = get_period_label(period)
    info_cell.value = f"دوره: {period_label} | از {shamsi_start} تا {shamsi_end} | تمام اعضا"
    info_cell.font = Font(size=10, italic=True)
    info_cell.alignment = Alignment(horizontal='right')

    ws.append([])  # سطر خالی

    # سرتیتر‌های ستون‌ها
    headers = [
        'نام کامل',           # Member Full Name
        'کد گروهی',           # Group Code
        'روز و تاریخ ثبت',    # Submission Date
        'فیلد مهارت'           # Skills Input
    ]

    ws.append(headers)

    # استایل سرتیتر
    for cell in ws[4]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = border

    # پر کردن داده‌های اعضاء
    row_num = 5
    for member in members:
        try:
            # دریافت رکوردهای رشد فردی در این دوره
            records = PersonalGrowthRecord.objects.filter(
                user=member,
                created_at__gte=start_datetime,
                created_at__lte=end_datetime
            ).order_by('-created_at')

            # اگر کاربر رکوردی دارد، شامل کردن آن‌ها؛ در غیر این صورت خط خالی
            if records.exists():
                for record in records:
                    try:
                        shamsi_date = record.created_at.strftime('%Y/%m/%d')
                        # ✅ استخراج مهارت‌های ثبت‌شده با safety handling برای null/empty
                        skills_input = (record.skill_learning or '').strip() if record.skill_learning else ''

                        row_data = [
                            member.full_name or 'نام نامشخص',
                            member.group_code or '---',
                            shamsi_date,
                            skills_input
                        ]

                        ws.append(row_data)

                        # استایل سطرها
                        for cell in ws[row_num]:
                            cell.alignment = right_alignment
                            cell.border = border

                        row_num += 1
                    except Exception as record_err:
                        print(f'[WARNING] Error processing record {record.id}: {str(record_err)}')
                        continue
            else:
                # افزودن خط خالی برای اعضاء بدون ثبت
                try:
                    row_data = [
                        member.full_name or 'نام نامشخص',
                        member.group_code or '---',
                        '',
                        ''
                    ]

                    ws.append(row_data)

                    # استایل سطرها
                    for cell in ws[row_num]:
                        cell.alignment = right_alignment
                        cell.border = border

                    row_num += 1
                except Exception as e:
                    print(f'[WARNING] Error adding empty row for member {member.id}: {str(e)}')
                    continue
        except Exception as member_err:
            print(f'[WARNING] Error processing member {member.id}: {str(member_err)}')
            continue

    # تنظیم عرض ستون‌ها
    column_widths = [20, 15, 20, 30]
    for idx, width in enumerate(column_widths, 1):
        col_letter = chr(64 + idx)
        ws.column_dimensions[col_letter].width = width

    # خط خلاصه در انتهای فایل
    ws.append([])
    ws.append([f'✅ جمع کل اعضا (همگانی): {members.count()}'])

    # ذخیره در حافظه
    output = BytesIO()
    wb.save(output)
    output.seek(0)

    # نام فایل
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    period_text = 'Sunday_3days' if period == 'sunday' else 'Thursday_4days'
    filename = f"Skills_GLOBAL_AllMembers_{period_text}_{timestamp}.xlsx"

    return output.getvalue(), filename



def export_sports_to_excel(period: str, reference_date=None) -> tuple:
    """
    ✅ صادرات ساعت‌های ورزش تمام اعضا (همگانی) به فایل Excel برای یک دوره خاص.
    
    فقط برای سرپرست ورزش (کد 27114)
    
    Args:
        period: 'sunday' یا 'thursday'
        reference_date: تاریخ مرجع (پیش‌فرض: امروز)
    
    Returns:
        tuple: (bytes محتوا، نام فایل)
    """
    from django.utils import timezone
    from .date_utils import get_period_dates, get_period_label
    from .models import PersonalGrowthRecord, User
    import jdatetime

    # محاسبه تاریخ‌های دوره
    start_datetime, end_datetime, shamsi_start, shamsi_end = get_period_dates(
        period=period,
        reference_date=reference_date
    )

    # ✅ دریافت تمام کاربران (بدون محدودیت کارگروه)
    members = User.objects.all().order_by('full_name')

    # ایجاد Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = 'صادرات ورزش'

    # تنظیم جهت RTL
    ws.sheet_view.rightToLeft = True

    # استایل‌های سرتیتر
    header_font = Font(bold=True, color='FFFFFF', size=12)
    header_fill = PatternFill(start_color='1F4E78', end_color='1F4E78', fill_type='solid')
    header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    right_alignment = Alignment(horizontal='right', vertical='center', wrap_text=True)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )

    # عنوان فایل
    ws.merge_cells('A1:D1')
    title_cell = ws['A1']
    title_cell.value = "✅ صادرات ساعت‌های ورزش (تمام اعضا)"
    title_cell.font = Font(bold=True, size=14, color='FFFFFF')
    title_cell.fill = PatternFill(start_color='203864', end_color='203864', fill_type='solid')
    title_cell.alignment = Alignment(horizontal='right')

    # اطلاعات دوره
    ws.merge_cells('A2:D2')
    info_cell = ws['A2']
    period_label = get_period_label(period)
    info_cell.value = f"دوره: {period_label} | از {shamsi_start} تا {shamsi_end} | تمام اعضا"
    info_cell.font = Font(size=10, italic=True)
    info_cell.alignment = Alignment(horizontal='right')

    ws.append([])  # سطر خالی

    # سرتیتر‌های ستون‌ها
    headers = [
        'نام کامل',           # Member Full Name
        'کد گروهی',           # Group Code
        'روز و تاریخ ثبت',    # Submission Date
        'ساعت ورزش'            # Exercise Hours
    ]

    ws.append(headers)

    # استایل سرتیتر
    for cell in ws[4]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = border

    # پر کردن داده‌های اعضاء
    row_num = 5
    for member in members:
        try:
            # دریافت رکوردهای رشد فردی در این دوره
            records = PersonalGrowthRecord.objects.filter(
                user=member,
                created_at__gte=start_datetime,
                created_at__lte=end_datetime
            ).order_by('-created_at')

            # اگر کاربر رکوردی دارد، شامل کردن آن‌ها؛ در غیر این صورت خط خالی
            if records.exists():
                for record in records:
                    try:
                        shamsi_date = record.created_at.strftime('%Y/%m/%d')
                        # ✅ استخراج ساعت‌های ورزش ثبت‌شده
                        exercise_hours = record.exercise_hours or 0.0

                        row_data = [
                            member.full_name or 'نام نامشخص',
                            member.group_code or '---',
                            shamsi_date,
                            str(exercise_hours)
                        ]

                        ws.append(row_data)

                        # استایل سطرها
                        for cell in ws[row_num]:
                            cell.alignment = right_alignment
                            cell.border = border

                        row_num += 1
                    except Exception as record_err:
                        print(f'[WARNING] Error processing record {record.id}: {str(record_err)}')
                        continue
            else:
                # افزودن خط خالی برای اعضاء بدون ثبت
                try:
                    row_data = [
                        member.full_name or 'نام نامشخص',
                        member.group_code or '---',
                        '',
                        ''
                    ]

                    ws.append(row_data)

                    # استایل سطرها
                    for cell in ws[row_num]:
                        cell.alignment = right_alignment
                        cell.border = border

                    row_num += 1
                except Exception as e:
                    print(f'[WARNING] Error adding empty row for member {member.id}: {str(e)}')
                    continue
        except Exception as member_err:
            print(f'[WARNING] Error processing member {member.id}: {str(member_err)}')
            continue

    # تنظیم عرض ستون‌ها
    column_widths = [20, 15, 20, 15]
    for idx, width in enumerate(column_widths, 1):
        col_letter = chr(64 + idx)
        ws.column_dimensions[col_letter].width = width

    # خط خلاصه در انتهای فایل
    ws.append([])
    ws.append([f'✅ جمع کل اعضا: {members.count()}'])

    # ذخیره در حافظه
    output = BytesIO()
    wb.save(output)
    output.seek(0)

    # نام فایل
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    period_text = 'Sunday_3days' if period == 'sunday' else 'Thursday_4days'
    filename = f"Sports_AllMembers_{period_text}_{timestamp}.xlsx"

    return output.getvalue(), filename


def export_islamic_studies_to_excel(period: str, reference_date=None) -> tuple:
    """
    ✅ صادرات صفحات مطالعه تمام اعضا (همگانی) به فایل Excel برای یک دوره خاص.
    
    فقط برای سرپرست مطالعات اسلامی (کد 27214)
    
    Args:
        period: 'sunday' یا 'thursday'
        reference_date: تاریخ مرجع (پیش‌فرض: امروز)
    
    Returns:
        tuple: (bytes محتوا، نام فایل)
    """
    from django.utils import timezone
    from .date_utils import get_period_dates, get_period_label
    from .models import PersonalGrowthRecord, User
    import jdatetime

    # محاسبه تاریخ‌های دوره
    start_datetime, end_datetime, shamsi_start, shamsi_end = get_period_dates(
        period=period,
        reference_date=reference_date
    )

    # ✅ دریافت تمام کاربران (بدون محدودیت کارگروه)
    members = User.objects.all().order_by('full_name')

    # ایجاد Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = 'صادرات مطالعه'

    # تنظیم جهت RTL
    ws.sheet_view.rightToLeft = True

    # استایل‌های سرتیتر
    header_font = Font(bold=True, color='FFFFFF', size=12)
    header_fill = PatternFill(start_color='1F4E78', end_color='1F4E78', fill_type='solid')
    header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    right_alignment = Alignment(horizontal='right', vertical='center', wrap_text=True)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )

    # عنوان فایل
    ws.merge_cells('A1:D1')
    title_cell = ws['A1']
    title_cell.value = "✅ صادرات صفحات مطالعه (تمام اعضا)"
    title_cell.font = Font(bold=True, size=14, color='FFFFFF')
    title_cell.fill = PatternFill(start_color='203864', end_color='203864', fill_type='solid')
    title_cell.alignment = Alignment(horizontal='right')

    # اطلاعات دوره
    ws.merge_cells('A2:D2')
    info_cell = ws['A2']
    period_label = get_period_label(period)
    info_cell.value = f"دوره: {period_label} | از {shamsi_start} تا {shamsi_end} | تمام اعضا"
    info_cell.font = Font(size=10, italic=True)
    info_cell.alignment = Alignment(horizontal='right')

    ws.append([])  # سطر خالی

    # سرتیتر‌های ستون‌ها
    headers = [
        'نام کامل',           # Member Full Name
        'کد گروهی',           # Group Code
        'روز و تاریخ ثبت',    # Submission Date
        'صفحات مطالعه'         # Reading Pages
    ]

    ws.append(headers)

    # استایل سرتیتر
    for cell in ws[4]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = border

    # پر کردن داده‌های اعضاء
    row_num = 5
    for member in members:
        try:
            # دریافت رکوردهای رشد فردی در این دوره
            records = PersonalGrowthRecord.objects.filter(
                user=member,
                created_at__gte=start_datetime,
                created_at__lte=end_datetime
            ).order_by('-created_at')

            # اگر کاربر رکوردی دارد، شامل کردن آن‌ها؛ در غیر این صورت خط خالی
            if records.exists():
                for record in records:
                    try:
                        shamsi_date = record.created_at.strftime('%Y/%m/%d')
                        # ✅ استخراج صفحات مطالعه ثبت‌شده
                        reading_pages = record.reading_pages or 0

                        row_data = [
                            member.full_name or 'نام نامشخص',
                            member.group_code or '---',
                            shamsi_date,
                            str(reading_pages)
                        ]

                        ws.append(row_data)

                        # استایل سطرها
                        for cell in ws[row_num]:
                            cell.alignment = right_alignment
                            cell.border = border

                        row_num += 1
                    except Exception as record_err:
                        print(f'[WARNING] Error processing record {record.id}: {str(record_err)}')
                        continue
            else:
                # افزودن خط خالی برای اعضاء بدون ثبت
                try:
                    row_data = [
                        member.full_name or 'نام نامشخص',
                        member.group_code or '---',
                        '',
                        ''
                    ]

                    ws.append(row_data)

                    # استایل سطرها
                    for cell in ws[row_num]:
                        cell.alignment = right_alignment
                        cell.border = border

                    row_num += 1
                except Exception as e:
                    print(f'[WARNING] Error adding empty row for member {member.id}: {str(e)}')
                    continue
        except Exception as member_err:
            print(f'[WARNING] Error processing member {member.id}: {str(member_err)}')
            continue

    # تنظیم عرض ستون‌ها
    column_widths = [20, 15, 20, 15]
    for idx, width in enumerate(column_widths, 1):
        col_letter = chr(64 + idx)
        ws.column_dimensions[col_letter].width = width

    # خط خلاصه در انتهای فایل
    ws.append([])
    ws.append([f'✅ جمع کل اعضا: {members.count()}'])

    # ذخیره در حافظه
    output = BytesIO()
    wb.save(output)
    output.seek(0)

    # نام فایل
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    period_text = 'Sunday_3days' if period == 'sunday' else 'Thursday_4days'
    filename = f"IslamicStudies_AllMembers_{period_text}_{timestamp}.xlsx"

    return output.getvalue(), filename
