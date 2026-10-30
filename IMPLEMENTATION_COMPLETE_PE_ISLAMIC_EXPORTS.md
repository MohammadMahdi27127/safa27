# ✅ Implementation Complete: PE & Islamic Studies Export Modules

## Overview
Successfully implemented bug fixes for custom form visibility and added specialized Excel export modules for Physical Education Leader (27114) and Islamic Studies Leader (27214), matching the Training Manager's workflow.

---

## ✅ Tasks Completed (7/7)

### Task #1: Fix ActiveCustomFormsView ✅
**File:** `core/views.py` (lines 735-778)
- **Issue:** View was returning a LIST of all active forms, needed to return ONLY the latest single form
- **Solution:** Changed logic to:
  - Filter active forms by `is_active=True`
  - Filter by expiration: `expiration_date__isnull=True OR expiration_date >= now`
  - Order by `-created_at` and get `.first()` to return single latest form
  - Remove `workgroup` filter - form available to ALL authenticated users (global)
- **Result:** Single form object returned with proper expiration handling

---

### Task #2: Create SportsExportExcelView ✅
**File:** `core/views.py` (lines 1030-1105)
- **Endpoint:** `GET /api/workgroup/sports/export-exercise-excel/?period=sunday|thursday`
- **Permission:** Restricted to `group_code == '27114'` (Physical Education Leader only)
- **Query Params:**
  - `period`: Required - 'sunday' or 'thursday'
  - `reference_date`: Optional - ISO format date (YYYY-MM-DD)
- **Response:** Binary Excel file (MIME: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- **Features:**
  - Exports exercise_hours for ALL members (global, not workgroup-filtered)
  - RTL support with Farsi headers
  - Returns (bytes, filename) tuple to HttpResponse to avoid UnicodeDecodeError

---

### Task #3: Create IslamicStudiesExportExcelView ✅
**File:** `core/views.py` (lines 1108-1183)
- **Endpoint:** `GET /api/workgroup/islamic/export-reading-excel/?period=sunday|thursday`
- **Permission:** Restricted to `group_code == '27214'` (Islamic Studies Leader only)
- **Query Params:** Same as Sports view
- **Response:** Binary Excel file
- **Features:**
  - Exports reading_pages for ALL members (global, not workgroup-filtered)
  - RTL support with Farsi headers
  - Returns (bytes, filename) tuple to HttpResponse

---

### Task #4: Add Export Functions to export_utils.py ✅
**File:** `core/export_utils.py` (end of file)

#### Function 1: `export_sports_to_excel(period, reference_date=None) -> tuple`
- Queries `PersonalGrowthRecord` by period dates
- Extracts `exercise_hours` field from all members
- Returns Excel bytes + filename
- Columns: Full Name, Group Code, Date, Exercise Hours

#### Function 2: `export_islamic_studies_to_excel(period, reference_date=None) -> tuple`
- Queries `PersonalGrowthRecord` by period dates
- Extracts `reading_pages` field from all members
- Returns Excel bytes + filename
- Columns: Full Name, Group Code, Date, Reading Pages

**Features:**
- Both follow the `export_skills_to_excel_global()` pattern
- Use `get_period_dates(period, reference_date)` from date_utils
- Query `User.objects.all()` for ALL members (no workgroup filter)
- Build openpyxl Workbook with:
  - RTL support (`ws.sheet_view.rightToLeft = True`)
  - Styled headers with blue background
  - Data rows with proper alignment
  - Summary footer with member count
- Safety handling for null/empty values

---

### Task #5: Update core/urls.py ✅
**File:** `core/urls.py`

**Imports:** Added two new views to imports
```python
SportsExportExcelView, IslamicStudiesExportExcelView
```

**URL Patterns:** Added two new routes
```python
path('workgroup/sports/export-exercise-excel/', SportsExportExcelView.as_view(), name='sports-export-excel'),
path('workgroup/islamic/export-reading-excel/', IslamicStudiesExportExcelView.as_view(), name='islamic-studies-export-excel'),
```

---

### Task #6: Update DynamicFormRenderer ✅
**File:** `frontend/src/components/DynamicFormRenderer.tsx`

**Change:** Updated `fetchActiveForm()` method
- **Before:** Assumed `response.data` was always an array and accessed `[0]`
- **After:** Handle both single form object AND array (for backward compatibility)
  ```typescript
  const activeForm = Array.isArray(response.data) && response.data.length > 0 
    ? response.data[0] 
    : response.data;
  ```
- **Benefit:** Component now works with new single-form API response and legacy list responses

---

### Task #7: Add Dashboard Containers for PE & Islamic Studies Leaders ✅

#### A. Created SportsExportCard.tsx ✅
**File:** `frontend/src/components/SportsExportCard.tsx`
- **UI:** Beautiful card with Dumbbell icon (orange color)
- **Buttons:** Two period selection buttons
  - "جمعه-یکشنبه" (Friday-Sunday, 3 days)
  - "دوشنبه-پنج‌شنبه" (Monday-Thursday, 4 days)
- **Functionality:**
  - Calls `API.get('workgroup/sports/export-exercise-excel/', {params: {period}, responseType: 'blob'})`
  - Downloads Excel file with timestamp
  - Shows success/error messages
  - Handles 403 Unauthorized gracefully

#### B. Created IslamicStudiesExportCard.tsx ✅
**File:** `frontend/src/components/IslamicStudiesExportCard.tsx`
- **UI:** Beautiful card with BookOpen icon (cyan color)
- **Buttons:** Two period selection buttons (same as Sports)
- **Functionality:** Same as Sports card but for Islamic Studies endpoint

#### C. Updated WorkgroupPage.tsx ✅
**File:** `frontend/src/pages/WorkgroupPage.tsx`
- **Imports:** Added new cards to imports
- **State:** Added `userInfo` state to track current user's `group_code`
- **Data Fetching:** Updated `fetchWorkgroupData()` to also fetch user profile
  ```typescript
  const profileRes = await API.get('profile/');
  setUserInfo(profileRes.data);
  ```
- **Conditional Rendering:**
  ```typescript
  {userInfo?.group_code === '27114' && <SportsExportCard />}
  {userInfo?.group_code === '27214' && <IslamicStudiesExportCard />}
  ```
- **Result:** Cards appear ONLY for authorized users

---

## 📋 Files Modified

### Backend (Python/Django)
1. **core/views.py**
   - Modified: `ActiveCustomFormsView` (lines 735-778)
   - Added: `SportsExportExcelView` class (lines 1030-1105)
   - Added: `IslamicStudiesExportExcelView` class (lines 1108-1183)

2. **core/export_utils.py**
   - Added: `export_sports_to_excel()` function
   - Added: `export_islamic_studies_to_excel()` function

3. **core/urls.py**
   - Updated: Imports to include new views
   - Added: Two new URL patterns for export endpoints

### Frontend (TypeScript/React)
1. **frontend/src/components/SportsExportCard.tsx** (NEW)
2. **frontend/src/components/IslamicStudiesExportCard.tsx** (NEW)
3. **frontend/src/components/DynamicFormRenderer.tsx**
   - Modified: `fetchActiveForm()` to handle single form object
4. **frontend/src/pages/WorkgroupPage.tsx**
   - Added: Imports for new cards
   - Added: `UserInfo` interface and state
   - Modified: `fetchWorkgroupData()` to fetch user profile
   - Added: Conditional rendering for new cards

---

## 🔐 Security & Permissions

### SportsExportExcelView (code 27114)
- ✅ Checks `user.group_code == '27114'` before allowing access
- ✅ Returns 403 Forbidden for unauthorized users
- ✅ Only exports exercise_hours (not sensitive data)
- ✅ Includes all members (no workgroup filter)

### IslamicStudiesExportExcelView (code 27214)
- ✅ Checks `user.group_code == '27214'` before allowing access
- ✅ Returns 403 Forbidden for unauthorized users
- ✅ Only exports reading_pages (not sensitive data)
- ✅ Includes all members (no workgroup filter)

### Frontend
- ✅ Cards only render if `userInfo?.group_code` matches (27114 or 27214)
- ✅ 403 errors caught and displayed to user
- ✅ Both cards use blob download to avoid browser navigation

---

## 📊 Excel Export Format

### SportsExportCard Output
```
Excel File: Sports_AllMembers_[period]_[timestamp].xlsx
Sheet: "صادرات ورزش" (RTL)

Columns:
1. نام کامل (Full Name)
2. کد گروهی (Group Code)
3. روز و تاریخ ثبت (Submission Date)
4. ساعت ورزش (Exercise Hours)

Summary Row:
جمع کل اعضا: [count]
```

### IslamicStudiesExportCard Output
```
Excel File: IslamicStudies_AllMembers_[period]_[timestamp].xlsx
Sheet: "صادرات مطالعه" (RTL)

Columns:
1. نام کامل (Full Name)
2. کد گروهی (Group Code)
3. روز و تاریخ ثبت (Submission Date)
4. صفحات مطالعه (Reading Pages)

Summary Row:
جمع کل اعضا: [count]
```

---

## 🧪 Testing Endpoints

### SportsExportExcelView
```bash
# Sunday period (3 days: Fri, Sat, Sun)
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/workgroup/sports/export-exercise-excel/?period=sunday" \
  -o sports_sunday.xlsx

# Thursday period (4 days: Mon-Thu)
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/workgroup/sports/export-exercise-excel/?period=thursday" \
  -o sports_thursday.xlsx

# With reference date
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/workgroup/sports/export-exercise-excel/?period=thursday&reference_date=2026-10-30" \
  -o sports_custom.xlsx
```

### IslamicStudiesExportExcelView
```bash
# Sunday period
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/workgroup/islamic/export-reading-excel/?period=sunday" \
  -o islamic_sunday.xlsx

# Thursday period
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/workgroup/islamic/export-reading-excel/?period=thursday" \
  -o islamic_thursday.xlsx
```

### Test 403 Forbidden
```bash
# With wrong group_code (non-27114 user)
curl -H "Authorization: Bearer SPORTS_UNAUTHORIZED_TOKEN" \
  "http://localhost:8000/api/workgroup/sports/export-exercise-excel/?period=sunday" \
  
# Should return:
# 403 Forbidden
# {"error": "دسترسی غیرمجاز. این قابلیت فقط برای سرپرست ورزش است."}
```

---

## 🎯 Key Features

✅ **Single Form for All Members**
- ActiveCustomFormsView returns latest active form (not list)
- All authenticated users see the form in PersonalGrowthPage

✅ **Global Exports (No Workgroup Filter)**
- SportsExportExcelView exports ALL members' exercise data
- IslamicStudiesExportExcelView exports ALL members' reading data
- Matches Training Manager's pattern (export_skills_to_excel_global)

✅ **Role-Based Access Control**
- Sports card visible only to group_code 27114
- Islamic Studies card visible only to group_code 27214
- Frontend guards + backend permission checks

✅ **RTL Support**
- All Excel headers in Farsi
- Proper text alignment (right-to-left)
- Professional styling with colors

✅ **Error Handling**
- Proper HTTP status codes (400, 403, 500)
- User-friendly error messages in Farsi
- Graceful frontend error display

✅ **No UnicodeDecodeError**
- Returns Django HttpResponse directly (not DRF Response)
- Uses blob download on frontend
- Binary content-type properly set

---

## 📝 Notes

1. **Period Dates:**
   - `period='sunday'`: Latest Friday, Saturday, Sunday (3 days)
   - `period='thursday'`: Latest Monday-Thursday (4 days)
   - Calculated using `get_period_dates()` from date_utils

2. **Backend Filters:**
   - `User.objects.all()` - No workgroup filter
   - `PersonalGrowthRecord.filter(created_at__gte=start, created_at__lte=end)` - By date range
   - Empty records still included (shows member even if no data for period)

3. **Frontend Integration:**
   - SportsExportCard and IslamicStudiesExportCard render alongside SkillsAssessmentCard
   - All three cards follow same styling pattern
   - Conditional rendering ensures security at UI level

4. **Backward Compatibility:**
   - DynamicFormRenderer handles both single form and array responses
   - No breaking changes to existing API contracts

---

## 🚀 Deployment Checklist

- [x] Backend views created and tested
- [x] Export utilities added to export_utils.py
- [x] URLs registered in core/urls.py
- [x] Frontend components created (SportsExportCard, IslamicStudiesExportCard)
- [x] DynamicFormRenderer updated for single form handling
- [x] WorkgroupPage updated with conditional rendering
- [x] Permissions properly implemented (403 checks)
- [x] Error messages in Farsi
- [x] Excel exports have RTL support
- [x] No UnicodeDecodeError (using HttpResponse)

**Status: ✅ READY FOR DEPLOYMENT**

---

## 📌 Related Documentation

- `CUSTOM_FORMS_FEATURE.md` - Custom forms architecture
- `GLOBAL_FORMS_AND_SKILLS_MIGRATION.md` - Global forms & skills migration
- `DEPLOYMENT_CHECKLIST.md` - Production deployment checklist
