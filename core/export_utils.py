"""
توابع صادرات داده‌های فرم‌های سفارشی و آمار مهارت‌های کارگروه به فایل‌های Excel
"""
from io import BytesIO
from datetime import datetime, timedelta
from django.utils import timezone
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
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
    
    # ✅ تنظیم عرض ستون‌ها بدون تداخل با سلول‌های ادغام‌شده (MergedCell)
    for col_idx in range(1, ws.max_column + 1):
        col_letter = get_column_letter(col_idx)
        max_length = 0
        # محاسبه طول محتوا فقط از سطرهای بعد از هدرهای ادغام‌شده (از سطر 4 به بعد)
        for row in range(4, ws.max_row + 1):
            cell_val = ws.cell(row=row, column=col_idx).value
            if cell_val is not None:
                max_length = max(max_length, len(str(cell_val)))
        adjusted_width = min(max(max_length + 4, 15), 50)
        ws.column_dimensions[col_letter].width = adjusted_width
    
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
    export_interval = dict(CustomForm.EXPORT_INTERVAL_CHOICES).get(form.export_interval_days, '')
    expiration_str = form.expiration_date.strftime('%Y/%m/%d') if form.expiration_date else 'بدون انقضا'
    info_cell.value = f"دوره تجمیع: {export_interval} | تاریخ انقضا: {expiration_str}"
    info_cell.font = Font(size=10, italic=True)
    info_cell.alignment = Alignment(horizontal='right')
    
    ws.append([])  # سطر خالی
    
    # سرتیتر‌های ستون‌ها
    headers = ['تاریخ ارسال', 'کد گروهی', 'نام کامل']
    
    # افزودن سرتیتر‌های فیلدهای دینامیک
    if form.fields_schema:
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
    
    # پر کردن داده‌ها
    row_num = 5
    for response in responses:
        shamsi_date = response.submitted_at.strftime('%Y/%m/%d %H:%M')
        row_data = [
            shamsi_date,
            response.user.group_code if response.user else '---',
            response.user.full_name if response.user else 'نام نامشخص'
        ]
        
        # افزودن پاسخ‌های دینامیک
        if form.fields_schema:
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
            cell.alignment = Alignment(horizontal='right', vertical='center', wrap_text=True)
            cell.border = border
        
        row_num += 1
    
    # ✅ تنظیم عرض ستون‌ها بدون تداخل با سلول‌های ادغام‌شده
    for col_idx in range(1, ws.max_column + 1):
        col_letter = get_column_letter(col_idx)
        max_length = 0
        for row in range(4, ws.max_row + 1):
            cell_val = ws.cell(row=row, column=col_idx).value
            if cell_val is not None:
                max_length = max(max_length, len(str(cell_val)))
        adjusted_width = min(max(max_length + 4, 15), 50)
        ws.column_dimensions[col_letter].width = adjusted_width
    
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
    """
    from .date_utils import get_period_dates, get_period_label
    from .models import PersonalGrowthRecord, User

    start_datetime, end_datetime, shamsi_start, shamsi_end = get_period_dates(
        period=period,
        reference_date=reference_date
    )

    members = User.objects.filter(workgroup=workgroup).order_by('full_name')

    wb = Workbook()
    ws = wb.active
    ws.title = 'صادرات مهارت‌ها'
    ws.sheet_view.rightToLeft = True

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

    ws.merge_cells('A1:D1')
    title_cell = ws['A1']
    title_cell.value = f"صادرات مهارت‌های {workgroup.name}"
    title_cell.font = Font(bold=True, size=14, color='FFFFFF')
    title_cell.fill = PatternFill(start_color='203864', end_color='203864', fill_type='solid')
    title_cell.alignment = Alignment(horizontal='right')

    ws.merge_cells('A2:D2')
    info_cell = ws['A2']
    period_label = get_period_label(period)
    info_cell.value = f"دوره: {period_label} | از {shamsi_start} تا {shamsi_end}"
    info_cell.font = Font(size=10, italic=True)
    info_cell.alignment = Alignment(horizontal='right')

    ws.append([])

    headers = ['نام کامل', 'کد گروهی', 'روز و تاریخ ثبت', 'فیلد مهارت']
    ws.append(headers)

    for cell in ws[4]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = border

    row_num = 5
    for member in members:
        try:
            records = PersonalGrowthRecord.objects.filter(
                user=member,
                created_at__gte=start_datetime,
                created_at__lte=end_datetime
            ).order_by('-created_at')

            if records.exists():
                for record in records:
                    try:
                        shamsi_date = record.created_at.strftime('%Y/%m/%d')
                        skills_input = (record.skill_learning or '').strip() if record.skill_learning else ''
                        row_data = [
                            member.full_name or 'نام نامشخص',
                            member.group_code or '---',
                            shamsi_date,
                            skills_input
                        ]
                        ws.append(row_data)
                        for cell in ws[row_num]:
                            cell.alignment = right_alignment
                            cell.border = border
                        row_num += 1
                    except Exception as record_err:
                        print(f'[WARNING] Error processing record {record.id}: {str(record_err)}')
                        continue
            else:
                try:
                    row_data = [member.full_name or 'نام نامشخص', member.group_code or '---', '', '']
                    ws.append(row_data)
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

    column_widths = [20, 15, 20, 30]
    for idx, width in enumerate(column_widths, 1):
        col_letter = get_column_letter(idx)
        ws.column_dimensions[col_letter].width = width

    ws.append([])
    ws.append([f'جمع کل اعضاء: {members.count()}'])

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    period_text = 'Sunday_3days' if period == 'sunday' else 'Thursday_4days'
    filename = f"Skills_{workgroup.name}_{period_text}_{timestamp}.xlsx"

    return output.getvalue(), filename


def export_skills_to_excel_global(period: str, reference_date=None) -> tuple:
    """
    صادرات مهارت‌های تمام اعضا (همگانی) به فایل Excel برای یک دوره خاص.
    """
    from .date_utils import get_period_dates, get_period_label
    from .models import PersonalGrowthRecord, User

    start_datetime, end_datetime, shamsi_start, shamsi_end = get_period_dates(
        period=period,
        reference_date=reference_date
    )

    members = User.objects.all().order_by('full_name')

    wb = Workbook()
    ws = wb.active
    ws.title = 'صادرات مهارت‌ها'
    ws.sheet_view.rightToLeft = True

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

    ws.merge_cells('A1:D1')
    title_cell = ws['A1']
    title_cell.value = "صادرات مهارت‌های تمام اعضا (همگانی)"
    title_cell.font = Font(bold=True, size=14, color='FFFFFF')
    title_cell.fill = PatternFill(start_color='203864', end_color='203864', fill_type='solid')
    title_cell.alignment = Alignment(horizontal='right')

    ws.merge_cells('A2:D2')
    info_cell = ws['A2']
    period_label = get_period_label(period)
    info_cell.value = f"دوره: {period_label} | از {shamsi_start} تا {shamsi_end} | تمام اعضا"
    info_cell.font = Font(size=10, italic=True)
    info_cell.alignment = Alignment(horizontal='right')

    ws.append([])

    headers = ['نام کامل', 'کد گروهی', 'روز و تاریخ ثبت', 'فیلد مهارت']
    ws.append(headers)

    for cell in ws[4]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = border

    row_num = 5
    for member in members:
        try:
            records = PersonalGrowthRecord.objects.filter(
                user=member,
                created_at__gte=start_datetime,
                created_at__lte=end_datetime
            ).order_by('-created_at')

            if records.exists():
                for record in records:
                    try:
                        shamsi_date = record.created_at.strftime('%Y/%m/%d')
                        skills_input = (record.skill_learning or '').strip() if record.skill_learning else ''
                        row_data = [
                            member.full_name or 'نام نامشخص',
                            member.group_code or '---',
                            shamsi_date,
                            skills_input
                        ]
                        ws.append(row_data)
                        for cell in ws[row_num]:
                            cell.alignment = right_alignment
                            cell.border = border
                        row_num += 1
                    except Exception as record_err:
                        print(f'[WARNING] Error processing record {record.id}: {str(record_err)}')
                        continue
            else:
                try:
                    row_data = [member.full_name or 'نام نامشخص', member.group_code or '---', '', '']
                    ws.append(row_data)
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

    column_widths = [20, 15, 20, 30]
    for idx, width in enumerate(column_widths, 1):
        col_letter = get_column_letter(idx)
        ws.column_dimensions[col_letter].width = width

    ws.append([])
    ws.append([f'جمع کل اعضا (همگانی): {members.count()}'])

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    period_text = 'Sunday_3days' if period == 'sunday' else 'Thursday_4days'
    filename = f"Skills_GLOBAL_AllMembers_{period_text}_{timestamp}.xlsx"

    return output.getvalue(), filename


def export_sports_to_excel(period: str, reference_date=None) -> tuple:
    """
    صادرات ساعت‌های ورزش تمام اعضا (همگانی) به فایل Excel برای یک دوره خاص.
    """
    from .date_utils import get_period_dates, get_period_label
    from .models import PersonalGrowthRecord, User

    start_datetime, end_datetime, shamsi_start, shamsi_end = get_period_dates(
        period=period,
        reference_date=reference_date
    )

    members = User.objects.all().order_by('full_name')

    wb = Workbook()
    ws = wb.active
    ws.title = 'صادرات ورزش'
    ws.sheet_view.rightToLeft = True

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

    ws.merge_cells('A1:D1')
    title_cell = ws['A1']
    title_cell.value = "صادرات ساعت‌های ورزش (تمام اعضا)"
    title_cell.font = Font(bold=True, size=14, color='FFFFFF')
    title_cell.fill = PatternFill(start_color='203864', end_color='203864', fill_type='solid')
    title_cell.alignment = Alignment(horizontal='right')

    ws.merge_cells('A2:D2')
    info_cell = ws['A2']
    period_label = get_period_label(period)
    info_cell.value = f"دوره: {period_label} | از {shamsi_start} تا {shamsi_end} | تمام اعضا"
    info_cell.font = Font(size=10, italic=True)
    info_cell.alignment = Alignment(horizontal='right')

    ws.append([])

    headers = ['نام کامل', 'کد گروهی', 'روز و تاریخ ثبت', 'ساعت ورزش']
    ws.append(headers)

    for cell in ws[4]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = border

    row_num = 5
    for member in members:
        try:
            records = PersonalGrowthRecord.objects.filter(
                user=member,
                created_at__gte=start_datetime,
                created_at__lte=end_datetime
            ).order_by('-created_at')

            if records.exists():
                for record in records:
                    try:
                        shamsi_date = record.created_at.strftime('%Y/%m/%d')
                        exercise_hours = record.exercise_hours or 0.0
                        row_data = [
                            member.full_name or 'نام نامشخص',
                            member.group_code or '---',
                            shamsi_date,
                            str(exercise_hours)
                        ]
                        ws.append(row_data)
                        for cell in ws[row_num]:
                            cell.alignment = right_alignment
                            cell.border = border
                        row_num += 1
                    except Exception as record_err:
                        print(f'[WARNING] Error processing record {record.id}: {str(record_err)}')
                        continue
            else:
                try:
                    row_data = [member.full_name or 'نام نامشخص', member.group_code or '---', '', '']
                    ws.append(row_data)
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

    column_widths = [20, 15, 20, 15]
    for idx, width in enumerate(column_widths, 1):
        col_letter = get_column_letter(idx)
        ws.column_dimensions[col_letter].width = width

    ws.append([])
    ws.append([f'جمع کل اعضا: {members.count()}'])

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    period_text = 'Sunday_3days' if period == 'sunday' else 'Thursday_4days'
    filename = f"Sports_AllMembers_{period_text}_{timestamp}.xlsx"

    return output.getvalue(), filename


def export_islamic_studies_to_excel(period: str, reference_date=None) -> tuple:
    """
    صادرات صفحات مطالعه تمام اعضا (همگانی) به فایل Excel برای یک دوره خاص.
    """
    from .date_utils import get_period_dates, get_period_label
    from .models import PersonalGrowthRecord, User

    start_datetime, end_datetime, shamsi_start, shamsi_end = get_period_dates(
        period=period,
        reference_date=reference_date
    )

    members = User.objects.all().order_by('full_name')

    wb = Workbook()
    ws = wb.active
    ws.title = 'صادرات مطالعه'
    ws.sheet_view.rightToLeft = True

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

    ws.merge_cells('A1:D1')
    title_cell = ws['A1']
    title_cell.value = "صادرات صفحات مطالعه (تمام اعضا)"
    title_cell.font = Font(bold=True, size=14, color='FFFFFF')
    title_cell.fill = PatternFill(start_color='203864', end_color='203864', fill_type='solid')
    title_cell.alignment = Alignment(horizontal='right')

    ws.merge_cells('A2:D2')
    info_cell = ws['A2']
    period_label = get_period_label(period)
    info_cell.value = f"دوره: {period_label} | از {shamsi_start} تا {shamsi_end} | تمام اعضا"
    info_cell.font = Font(size=10, italic=True)
    info_cell.alignment = Alignment(horizontal='right')

    ws.append([])

    headers = ['نام کامل', 'کد گروهی', 'روز و تاریخ ثبت', 'صفحات مطالعه']
    ws.append(headers)

    for cell in ws[4]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = border

    row_num = 5
    for member in members:
        try:
            records = PersonalGrowthRecord.objects.filter(
                user=member,
                created_at__gte=start_datetime,
                created_at__lte=end_datetime
            ).order_by('-created_at')

            if records.exists():
                for record in records:
                    try:
                        shamsi_date = record.created_at.strftime('%Y/%m/%d')
                        reading_pages = record.reading_pages or 0
                        row_data = [
                            member.full_name or 'نام نامشخص',
                            member.group_code or '---',
                            shamsi_date,
                            str(reading_pages)
                        ]
                        ws.append(row_data)
                        for cell in ws[row_num]:
                            cell.alignment = right_alignment
                            cell.border = border
                        row_num += 1
                    except Exception as record_err:
                        print(f'[WARNING] Error processing record {record.id}: {str(record_err)}')
                        continue
            else:
                try:
                    row_data = [member.full_name or 'نام نامشخص', member.group_code or '---', '', '']
                    ws.append(row_data)
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

    column_widths = [20, 15, 20, 15]
    for idx, width in enumerate(column_widths, 1):
        col_letter = get_column_letter(idx)
        ws.column_dimensions[col_letter].width = width

    ws.append([])
    ws.append([f'جمع کل اعضا: {members.count()}'])

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    period_text = 'Sunday_3days' if period == 'sunday' else 'Thursday_4days'
    filename = f"IslamicStudies_AllMembers_{period_text}_{timestamp}.xlsx"

    return output.getvalue(), filename