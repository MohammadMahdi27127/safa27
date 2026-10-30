# 🚀 Quick Reference - PE & Islamic Studies Exports

## TL;DR - What Was Done

✅ Fixed custom forms to return single latest form to all members
✅ Created Sports export for PE leaders (code 27114)
✅ Created Islamic Studies export for Islamic Studies leaders (code 27214)
✅ Both exports include ALL members' data (global scope)
✅ Added dashboard cards with conditional rendering
✅ Proper role-based access control (403 for unauthorized)

---

## API Endpoints Quick Test

### Sports Export (PE Leader only)
```bash
# Test with cURL
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/workgroup/sports/export-exercise-excel/?period=sunday"

# Expected: Binary Excel file (.xlsx)
# User must have group_code == '27114'
```

### Islamic Studies Export (Islamic Studies Leader only)
```bash
# Test with cURL
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/workgroup/islamic/export-reading-excel/?period=thursday"

# Expected: Binary Excel file (.xlsx)
# User must have group_code == '27214'
```

### Test Unauthorized Access
```bash
# As non-27114 user trying sports export
curl -H "Authorization: Bearer WRONG_TOKEN" \
  "http://localhost:8000/api/workgroup/sports/export-exercise-excel/?period=sunday"

# Expected: 403 Forbidden
# {"error": "دسترسی غیرمجاز. این قابلیت فقط برای سرپرست ورزش است."}
```

---

## Frontend Components

### SportsExportCard
- **Location:** `frontend/src/components/SportsExportCard.tsx`
- **Usage:** Used in WorkgroupPage
- **Visibility:** Only if `userInfo?.group_code === '27114'`
- **Calls:** `API.get('workgroup/sports/export-exercise-excel/', {params: {period}, responseType: 'blob'})`

### IslamicStudiesExportCard
- **Location:** `frontend/src/components/IslamicStudiesExportCard.tsx`
- **Usage:** Used in WorkgroupPage
- **Visibility:** Only if `userInfo?.group_code === '27214'`
- **Calls:** `API.get('workgroup/islamic/export-reading-excel/', {params: {period}, responseType: 'blob'})`

---

## Backend Views

### SportsExportExcelView
```python
# File: core/views.py (lines 1030-1105)
class SportsExportExcelView(views.APIView):
    permission_classes = [IsAuthenticated]
    SPORTS_LEADER_CODE = '27114'
    
    def get(self, request):
        # 1. Check permission (group_code == 27114)
        # 2. Validate period (sunday|thursday)
        # 3. Call export_sports_to_excel()
        # 4. Return HttpResponse (not DRF Response to avoid UnicodeDecodeError)
```

### IslamicStudiesExportExcelView
```python
# File: core/views.py (lines 1108-1183)
class IslamicStudiesExportExcelView(views.APIView):
    permission_classes = [IsAuthenticated]
    ISLAMIC_STUDIES_LEADER_CODE = '27214'
    
    def get(self, request):
        # 1. Check permission (group_code == 27214)
        # 2. Validate period (sunday|thursday)
        # 3. Call export_islamic_studies_to_excel()
        # 4. Return HttpResponse (not DRF Response to avoid UnicodeDecodeError)
```

---

## Export Functions

### export_sports_to_excel()
```python
# File: core/export_utils.py (end of file)
def export_sports_to_excel(period: str, reference_date=None) -> tuple:
    """
    Exports exercise_hours for ALL members
    
    Args:
        period: 'sunday' or 'thursday'
        reference_date: Optional, YYYY-MM-DD format
    
    Returns:
        (bytes, filename)
    
    Excel columns:
    - نام کامل (Full Name)
    - کد گروهی (Group Code)
    - روز و تاریخ ثبت (Date)
    - ساعت ورزش (Exercise Hours)
    """
```

### export_islamic_studies_to_excel()
```python
# File: core/export_utils.py (end of file)
def export_islamic_studies_to_excel(period: str, reference_date=None) -> tuple:
    """
    Exports reading_pages for ALL members
    
    Args:
        period: 'sunday' or 'thursday'
        reference_date: Optional, YYYY-MM-DD format
    
    Returns:
        (bytes, filename)
    
    Excel columns:
    - نام کامل (Full Name)
    - کد گروهی (Group Code)
    - روز و تاریخ ثبت (Date)
    - صفحات مطالعه (Reading Pages)
    """
```

---

## URL Routes

```python
# File: core/urls.py
path('workgroup/sports/export-exercise-excel/', SportsExportExcelView.as_view(), name='sports-export-excel'),
path('workgroup/islamic/export-reading-excel/', IslamicStudiesExportExcelView.as_view(), name='islamic-studies-export-excel'),
```

---

## Key Differences From Training Manager

| Aspect | Training Manager | PE Leader | Islamic Studies Leader |
|--------|-----------------|-----------|----------------------|
| Endpoint | `/api/workgroup/training/export-skills-excel/` | `/api/workgroup/sports/export-exercise-excel/` | `/api/workgroup/islamic/export-reading-excel/` |
| Group Code | 27118 | 27114 | 27214 |
| Field Exported | skill_learning | exercise_hours | reading_pages |
| Excel Column | فیلد مهارت | ساعت ورزش | صفحات مطالعه |
| Component | SkillsAssessmentCard | SportsExportCard | IslamicStudiesExportCard |

---

## Period Definitions

### Sunday Period (جمعه-یکشنبه)
- Starts: Most recent Friday (juma)
- Ends: Current Sunday
- Days: 3 days
- Query: `?period=sunday`

### Thursday Period (دوشنبه-پنج‌شنبه)
- Starts: Most recent Monday (doshanbeh)
- Ends: Current Thursday (panjshanbe)
- Days: 4 days
- Query: `?period=thursday`

---

## Troubleshooting

### Issue: 403 Forbidden on Export
**Cause:** User's `group_code` doesn't match the export's code
**Solution:** 
- For Sports (27114): Ensure user has `group_code='27114'`
- For Islamic Studies (27214): Ensure user has `group_code='27214'`

### Issue: Invalid Period Error
**Cause:** Period parameter is not 'sunday' or 'thursday'
**Solution:** Use only `?period=sunday` or `?period=thursday`

### Issue: Download File is Corrupted
**Cause:** UnicodeDecodeError (old code using DRF Response)
**Solution:** ✅ Fixed - now uses Django HttpResponse directly

### Issue: Card Not Showing in WorkgroupPage
**Cause:** User profile not fetched or group_code doesn't match
**Solution:** 
1. Verify user profile endpoint works
2. Check user's actual group_code in database
3. Check conditional render: `userInfo?.group_code === '27114'` or `'27214'`

### Issue: Excel File Has Wrong Data
**Cause:** Period dates calculated incorrectly
**Solution:** Check `get_period_dates()` in `core/date_utils.py`

---

## Files Changed Summary

```
Backend:
✅ core/views.py (3 changes)
   - Modified: ActiveCustomFormsView (return single form)
   - Added: SportsExportExcelView class
   - Added: IslamicStudiesExportExcelView class

✅ core/export_utils.py (2 additions)
   - Added: export_sports_to_excel() function
   - Added: export_islamic_studies_to_excel() function

✅ core/urls.py (2 additions)
   - Added: Import for new views
   - Added: 2 URL routes

Frontend:
✅ frontend/src/components/SportsExportCard.tsx (NEW)
✅ frontend/src/components/IslamicStudiesExportCard.tsx (NEW)
✅ frontend/src/components/DynamicFormRenderer.tsx (1 change)
   - Modified: fetchActiveForm() to handle single form
✅ frontend/src/pages/WorkgroupPage.tsx (4 changes)
   - Added: Imports
   - Added: UserInfo state
   - Added: Profile fetch
   - Added: Conditional renders
```

---

## Permission Matrix

```
User Role           | Sports Export | Islamic Export | Custom Forms | Skills Export
                    | (27114)       | (27214)        | (all members)| (27118)
--------------------|---------------|----------------|--------------|---------------
PE Leader (27114)   | ✅ YES        | ❌ NO          | ✅ YES       | ❌ NO
Islamic Leader      | ❌ NO         | ✅ YES         | ✅ YES       | ❌ NO
(27214)             |               |                |              |
Training Manager    | ❌ NO         | ❌ NO          | ✅ YES       | ✅ YES
(27118)             |               |                |              |
Regular Member      | ❌ NO         | ❌ NO          | ✅ YES       | ❌ NO
```

---

## Performance Notes

- ✅ Global exports query ALL users (no workgroup filter)
- ✅ Uses `order_by('-created_at')` for efficient sorting
- ✅ Excel generation done in-memory (BytesIO)
- ✅ No database pagination needed (streaming to memory)
- ✅ Consider caching if exporting frequently

---

## Future Enhancements

- [ ] Add export history/logs for audit trail
- [ ] Add date range picker instead of fixed periods
- [ ] Add email delivery of exports
- [ ] Add scheduled automatic exports
- [ ] Add export format options (CSV, PDF)
- [ ] Add member filter in exports
- [ ] Add comparison exports (period-over-period)

---

## Contact & Support

**For Issues:**
1. Check VERIFICATION_CHECKLIST.md
2. Check IMPLEMENTATION_COMPLETE_PE_ISLAMIC_EXPORTS.md
3. Review error logs in backend console
4. Check browser dev tools (Network tab) for 403s

**Key Files to Review:**
- `core/views.py` - Backend logic
- `core/export_utils.py` - Excel generation
- `frontend/src/pages/WorkgroupPage.tsx` - Conditional rendering
- `frontend/src/components/SportsExportCard.tsx` - UI component
