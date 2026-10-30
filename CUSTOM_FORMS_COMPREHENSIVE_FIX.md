# ✅ Custom Forms: Comprehensive Fix & Multi-Form Architecture

## Summary
تمام مشکلات فرم‌های سفارشی حل شدند و معماری چند‌فرم فعال پیاده‌سازی شد.

---

## Part 1: ✅ Fix 403 Forbidden on Submission

### Change: core/views.py - CustomFormResponseCreateView.post()
**Line:** ~816

**Removed:**
```python
# ❌ اینها حذف شدند:
if form.workgroup and request.user.workgroup != form.workgroup:
    return Response({'error': '...'}, status=status.HTTP_403_FORBIDDEN)
```

**Now:**
- ✅ هر کاربر authenticated می‌تواند به هر فرم فعالی پاسخ دهد
- ✅ فقط بررسی می‌شود: `form.is_active == True` و `not form.is_expired()`
- ✅ هیچ workgroup mismatch check نیست

**Test:**
```bash
curl -X POST http://localhost:8000/api/custom-forms/1/submit/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answers": {"field1": "value1"}}'
# Expected: 201 Created (no 403)
```

---

## Part 2: ✅ Export with Creator Isolation & 404 Fix

### View: core/views.py - CustomFormExportExcelView
**Line:** ~884-956

**Features:**
- ✅ نقطه پایانی: `GET /api/custom-forms/{form_id}/export-excel/?days=7`
- ✅ فقط سازنده فرم (یا superuser) می‌تواند export کند
- ✅ فیلتر بر اساس بازه زمانی (query param `days`)
- ✅ Export: Excel file with columns: [نام و نام خانوادگی, کد گروهی, کارگروه, تاریخ ثبت, <سوالات>]
- ✅ Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (no DRF Response wrapper)

**Security:**
```python
if form.creator != request.user and not request.user.is_superuser:
    return Response({'error': 'دسترسی غیرمجاز.'}, status=status.HTTP_403_FORBIDDEN)
```

**Test:**
```bash
# مسئول فرم (creator)
curl -X GET "http://localhost:8000/api/custom-forms/1/export-excel/?days=7" \
  -H "Authorization: Bearer CREATOR_TOKEN" \
  -o form_export.xlsx
# Expected: 200 + Excel file

# کاربر غیرمسئول
curl -X GET "http://localhost:8000/api/custom-forms/1/export-excel/?days=7" \
  -H "Authorization: Bearer USER_TOKEN"
# Expected: 403 Forbidden
```

---

## Part 3: ✅ Multiple Active Forms Architecture

### Backend: core/views.py - ActiveCustomFormsView
**Line:** ~737-801

**Change:** Single Form → Array of All Active Forms

**Old Response:**
```json
{
  "id": 1,
  "title": "فرم رشد فردی",
  "has_submitted": false,
  ...
}
```

**New Response:**
```json
[
  {
    "id": 1,
    "title": "فرم رشد فردی",
    "has_submitted": false,
    "fields_schema": [...]
  },
  {
    "id": 2,
    "title": "فرم ورزشی",
    "has_submitted": true,
    "fields_schema": [...]
  }
]
```

**Query Logic:**
```python
active_forms = CustomForm.objects.filter(
    is_active=True
).filter(
    Q(expiration_date__isnull=True) | Q(expiration_date__gte=today)
).order_by('-created_at')

# دریافت فرم‌هایی که کاربر پاسخ داده است
user_submitted_form_ids = set(
    CustomFormResponse.objects.filter(
        user=request.user,
        form__in=active_forms
    ).values_list('form_id', flat=True)
)

# اضافه‌کردن has_submitted برای هر فرم
for form in active_forms:
    form_data['has_submitted'] = form.id in user_submitted_form_ids
```

**Test:**
```bash
curl -X GET "http://localhost:8000/api/custom-forms/active/" \
  -H "Authorization: Bearer TOKEN"
# Expected: 200 + Array of forms
```

---

### Frontend: CustomFormCard Component
**File:** `frontend/src/components/CustomFormCard.tsx` (NEW)

**Features:**
- ✅ Renders single form in independent container
- ✅ Supports field types: text, textarea, select, radio, checkbox
- ✅ Shows `has_submitted` badge (green, read-only state)
- ✅ Form submission via POST `/api/custom-forms/{form_id}/submit/`
- ✅ Error/success messages
- ✅ Loading state during submission

**Props:**
```typescript
interface CustomFormCardProps {
  form: CustomForm;
  onSuccess?: () => void;  // callback to refresh forms list
}
```

**State Management:**
```typescript
const [answers, setAnswers] = useState<Record<string, any>>({});
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);
```

---

### Frontend: GrowthPage Update
**File:** `frontend/src/pages/GrowthPage.tsx`

**Changes:**

1. **New State:**
```typescript
const [activeForms, setActiveForms] = useState<any[]>([]);
const [formsLoading, setFormsLoading] = useState(false);
```

2. **New Function:**
```typescript
const fetchActiveForms = async () => {
  setFormsLoading(true);
  try {
    const res = await API.get('/api/custom-forms/active/');
    setActiveForms(Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    console.error('Error fetching active forms:', err);
    setActiveForms([]);
  } finally {
    setFormsLoading(false);
  }
};
```

3. **New Render Section:**
```tsx
{activeForms.length > 0 ? (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    <h3>📋 فرم‌های فعال برای تکمیل</h3>
    {activeForms.map((form) => (
      <CustomFormCard
        key={form.id}
        form={form}
        onSuccess={fetchActiveForms}
      />
    ))}
  </div>
) : null}
```

---

## Integration Checklist

### Backend
- [x] Fix 403 in submission view (no workgroup check)
- [x] Export view with creator isolation
- [x] Export URL registered at `/api/custom-forms/{form_id}/export-excel/`
- [x] ActiveCustomFormsView returns array (not single form)
- [x] Each form includes `has_submitted` flag
- [x] Response includes all necessary fields: id, title, description, fields_schema, expiration_date, is_expired, workgroup_name, created_at

### Frontend
- [x] CustomFormCard component created
- [x] Handles all field types (text, textarea, select, radio, checkbox)
- [x] Shows `has_submitted` badge correctly
- [x] Error/success messages
- [x] GrowthPage imports CustomFormCard
- [x] GrowthPage fetches active forms on mount
- [x] GrowthPage renders forms in stacked layout
- [x] Each form submission refreshes the list

---

## End-to-End Test Scenario

### Setup
1. Create 2 active forms in admin:
   - Form A: "رشد فردی" (global, no workgroup)
   - Form B: "فرم ورزشی" (expires in 7 days)

2. 3 users: User1, User2, User3

### Test Flow
1. **User1 Opens GrowthPage**
   - Request: `GET /api/custom-forms/active/`
   - Expected: Returns [Form A, Form B]
   - Expected: Both show `has_submitted: false`

2. **User1 Submits Form A**
   - Request: `POST /api/custom-forms/1/submit/` with answers
   - Expected: 201 Created, response saved
   - Expected: Form A now shows `has_submitted: true` (local state)
   - Expected: Form B still shows `has_submitted: false`

3. **User1 Refreshes Page**
   - Request: `GET /api/custom-forms/active/`
   - Expected: Form A shows `has_submitted: true`
   - Expected: Form B shows `has_submitted: false`
   - Expected: Form A container shows green "پاسخ شما ثبت شده است" badge
   - Expected: Form B still shows input fields (can submit)

4. **Form Creator Exports**
   - Request: `GET /api/custom-forms/1/export-excel/?days=7`
   - Expected: 200 + Excel file containing:
     - Header: [نام و نام خانوادگی, کد گروهی, کارگروه, تاریخ ثبت, <field1>, <field2>, ...]
     - Row 1: User1's response
   - Expected: Filename like: `form_responses_2026_10_30.xlsx`

5. **Non-Creator Tries Export**
   - Request: `GET /api/custom-forms/1/export-excel/?days=7` (as User2)
   - Expected: 403 Forbidden (User2 didn't create the form)

6. **User2 Accesses GrowthPage**
   - Request: `GET /api/custom-forms/active/`
   - Expected: [Form A, Form B]
   - Expected: Both show `has_submitted: false`
   - Expected: User2 can submit both independently

---

## Files Modified/Created

### Backend
- ✅ `core/views.py` - Updated 3 views:
  - `ActiveCustomFormsView` (lines 737-801): Returns array of all active forms
  - `CustomFormResponseCreateView` (lines 803-856): Removed workgroup check
  - `CustomFormExportExcelView` (lines 884-956): Export with creator isolation (already existed)

### Frontend
- ✅ `frontend/src/components/CustomFormCard.tsx` (NEW)
- ✅ `frontend/src/pages/GrowthPage.tsx` - Updated:
  - Added import for CustomFormCard
  - Added state: activeForms, formsLoading
  - Added function: fetchActiveForms()
  - Added render section: Multiple CustomFormCard stack

---

## Known Limitations & Notes

1. **No Real-time Updates**: Forms list updates on page refresh or onSuccess callback
2. **Single Response per User**: Each user can have only 1 response per form (update_or_create logic)
3. **Export Requires Creator**: Only form creator can export (not workgroup leader)
4. **No Form Deletion**: Users can't delete submitted responses (by design)
5. **Field Schema Validation**: Client-side validation only (no complex backend validators)

---

## Deployment Checklist

- [ ] Run `python manage.py migrate core` (includes 0006_user_avatar_base64 and any new migrations)
- [ ] Restart Django server
- [ ] Clear frontend cache or rebuild
- [ ] Test scenario from "End-to-End Test Scenario" section
- [ ] Verify export Excel generation in admin
- [ ] Monitor server logs for any import/serialization errors

---

## Rollback Plan

If issues arise:
1. Revert `core/views.py` changes (use git)
2. Revert frontend components (git)
3. If database migrations fail: `python manage.py migrate core 0005_make_customform_fields_optional`

---

**Status: ✅ READY FOR DEPLOYMENT**
