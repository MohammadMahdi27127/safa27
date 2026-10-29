# Dynamic Form Builder and Response Collection Feature

## Overview

A comprehensive system for creating, managing, and responding to custom forms within workgroups. Workgroup leaders can design dynamic forms with various field types, set aggregation windows, and export responses to Excel. Members can fill out active forms and see their submission status.

## Architecture

### Backend (Django + DRF)

#### Models

1. **CustomForm**
   - Creator: ForeignKey to User (workgroup leader)
   - Workgroup: ForeignKey to specific workgroup
   - Title: CharField for form name
   - Description: Optional TextField
   - export_interval_days: IntegerField (3, 5, or 7 days) - configurable aggregation window
   - expiration_date: DateTimeField - auto-deactivates form after this date
   - fields_schema: JSONField - dynamic form structure
   - is_active: BooleanField - auto-managed based on expiration_date
   - created_at, updated_at: Timestamps

2. **CustomFormResponse**
   - Form: ForeignKey to CustomForm
   - User: ForeignKey to User (respondent)
   - Answers: JSONField - key-value pairs matching fields_schema
   - submitted_at: DateTimeField (auto_now_add)
   - Unique constraint: (form, user) - one response per user per form

#### API Endpoints

**Leader Endpoints:**
- `POST /api/custom-forms/` - Create new form (requires workgroup_leader=True)
- `GET /api/custom-forms/list/` - List forms for workgroup leader
- `GET /api/custom-forms/<form_id>/` - View form details
- `PUT /api/custom-forms/<form_id>/` - Update form
- `DELETE /api/custom-forms/<form_id>/` - Delete form
- `GET /api/custom-forms/<form_id>/responses/` - List responses for form
- `GET /api/custom-forms/<form_id>/export-excel/` - Download responses as .xlsx

**User Endpoints:**
- `GET /api/custom-forms/active/` - Get active forms for user's workgroup
- `POST /api/custom-forms/<form_id>/submit/` - Submit/update responses

#### Excel Export

- File: `core/export_utils.py`
- Function: `export_form_responses_to_excel(form)`
- Features:
  - RTL support for Persian text
  - Professional formatting with headers, borders, colors
  - Dynamic columns based on form schema
  - Includes: submission date, user code, full name, answers
  - Aggregation by export_interval_days
  - File naming: `{form_title}_{timestamp}.xlsx`

### Frontend (React + TypeScript)

#### Components

1. **DynamicFormRenderer** (`src/components/DynamicFormRenderer.tsx`)
   - Location: Integrated in GrowthPage below Personal Growth container
   - Features:
     - Fetches active forms for user's workgroup
     - Renders dynamic fields based on fields_schema
     - Supports: text, textarea, number, select, radio, checkbox
     - Form validation for required fields
     - Handles form submission and update
     - RTL support for Persian interface
     - Status messages (success/error/info)

2. **FormBuilder** (`src/components/FormBuilder.tsx`)
   - Purpose: Allows workgroup leaders to create forms
   - Features:
     - Form title and description
     - **Required settings:**
       - Radio button group for export interval (3, 5, or 7 days)
       - Date picker for form expiration date
     - Dynamic field builder with add/edit/delete
     - Field types: text, textarea, number, select, radio, checkbox
     - Field properties: label, required flag, placeholder, options
     - Form validation
     - Status messages

#### Pages

3. **FormManagerPage** (`src/pages/FormManagerPage.tsx`)
   - Route: `/form-manager`
   - Purpose: Central hub for workgroup leaders
   - Features:
     - Toggle FormBuilder modal
     - List all forms created by leader
     - Status indicators (active/expired/inactive)
     - Show: export interval, expiration date, response count
     - Actions: View, Export to Excel, Edit (placeholder), Delete
     - Form metadata display

#### Integration

- GrowthPage: DynamicFormRenderer added as independent container below Personal Growth section
- App.tsx: FormManagerPage route added for workgroup leaders
- Both components match existing UI aesthetic (dark theme, Tailwind CSS, RTL support)

## Database Structure

```
CustomForm
├── id (PK)
├── creator_id (FK -> User)
├── workgroup_id (FK -> Workgroup)
├── title
├── description
├── export_interval_days (3, 5, or 7)
├── expiration_date
├── fields_schema (JSON)
├── is_active
├── created_at
└── updated_at

CustomFormResponse
├── id (PK)
├── form_id (FK -> CustomForm)
├── user_id (FK -> User)
├── answers (JSON)
├── submitted_at
└── Unique(form_id, user_id)
```

## Field Schema Structure

```json
{
  "fields_schema": [
    {
      "name": "field_1",
      "label": "Your Name",
      "type": "text",
      "required": true,
      "order": 0,
      "placeholder": "Enter your full name"
    },
    {
      "name": "field_2",
      "label": "Your Rating",
      "type": "radio",
      "required": true,
      "order": 1,
      "options": [
        { "value": "option_0", "label": "Excellent" },
        { "value": "option_1", "label": "Good" },
        { "value": "option_2", "label": "Fair" }
      ]
    }
  ]
}
```

## Usage Flow

### For Workgroup Leaders

1. Navigate to `/form-manager`
2. Click the "+" button to open FormBuilder
3. Enter form details:
   - Title and optional description
   - Select export interval (3, 5, or 7 days)
   - Pick form expiration date
4. Add dynamic fields:
   - Choose field type
   - Add label, placeholder, set as required
   - For select/radio/checkbox, add options
5. Click "✨ منتشر کردن فرم" to publish
6. View form list with response counts
7. Click "صادرات" to download responses as Excel
8. Delete forms if needed

### For Users

1. Visit `/growth` (Personal Growth page)
2. Scroll down to "فرم‌های سفارشی" (Custom Forms) section
3. View active form (if any)
4. Fill out all required fields
5. Click "ارسال پاسخ‌ها" (Submit Answers)
6. Get success confirmation
7. Update response anytime before form expires

## Key Features

✅ **Dynamic Forms**
- No code required to create forms
- Supports 6 field types
- Flexible field ordering

✅ **Permissions**
- Only workgroup leaders can create forms
- Forms auto-filter by user's workgroup
- Creator-only editing/deletion

✅ **Expiration Management**
- Automatic form deactivation after expiration date
- is_active field auto-managed
- Users cannot submit expired forms

✅ **Export Functionality**
- Export to professional Excel format
- RTL support for Persian text
- Includes user metadata
- Respects export_interval_days setting
- Automatic filename with timestamp

✅ **UI/UX**
- 100% aesthetic match with existing app design
- RTL support throughout
- Dark theme with purple/pink gradients
- Real-time validation
- Loading states and error handling

✅ **Data Management**
- One response per user per form (unique constraint)
- Update-or-create semantics (can resubmit)
- Clean JSON storage for flexibility

## Implementation Checklist

✅ Django Models (CustomForm, CustomFormResponse)
✅ Django Serializers (with metadata helpers)
✅ Django Views (7 views for all operations)
✅ URL Routing (7 endpoints)
✅ Excel Export Utility (openpyxl-based)
✅ React DynamicFormRenderer Component
✅ React FormBuilder Component
✅ React FormManagerPage
✅ Integration into GrowthPage
✅ App.tsx Routing
✅ Requirements.txt (added openpyxl)

## Dependencies Added

```
openpyxl  # For Excel file generation
```

## Testing Scenarios

### Scenario 1: Create and Submit Form
1. Workgroup Leader creates form with 3 fields
2. User sees active form on Growth page
3. User fills out form and submits
4. Leader exports to Excel and verifies data

### Scenario 2: Form Expiration
1. Create form with yesterday's expiration date
2. Verify form appears as "منقضی شده" (expired)
3. User cannot submit to expired form

### Scenario 3: Export Interval
1. Create form with 5-day export interval
2. Submit responses across multiple dates
3. Export includes all responses (interval is for data organization, not filtering)

### Scenario 4: Field Validation
1. Create form with required text field
2. User attempts to submit without filling
3. Validation error message appears
4. Cannot submit until required fields filled

### Scenario 5: Multiple Field Types
1. Create form with all 6 field types
2. User submits with mixed data types
3. Verify answers stored correctly in JSON
4. Export shows all field types properly

## Files Modified/Created

**Backend:**
- ✅ core/models.py (added CustomForm, CustomFormResponse)
- ✅ core/serializers.py (added 2 serializers)
- ✅ core/views.py (added 7 views)
- ✅ core/urls.py (added 7 endpoints)
- ✅ core/export_utils.py (NEW - Excel export)
- ✅ requirements.txt (added openpyxl)

**Frontend:**
- ✅ src/components/DynamicFormRenderer.tsx (NEW)
- ✅ src/components/FormBuilder.tsx (NEW)
- ✅ src/pages/FormManagerPage.tsx (NEW)
- ✅ src/pages/GrowthPage.tsx (integrated DynamicFormRenderer)
- ✅ src/App.tsx (added /form-manager route)

## Error Handling

- Form not found → 404 response
- Unauthorized access → 403 Forbidden
- Expired form → 400 Bad Request
- Missing required fields → Validation error
- Invalid export interval → 400 Bad Request
- Excel generation failure → Error message

## Performance Considerations

- Custom forms lazy-loaded on Growth page
- Excel export streams file (BytesIO)
- Form list paginated (ready for future)
- Unique constraint prevents duplicate submissions
- Indexes on (form_id, user_id) for responses

## Future Enhancements

- [ ] Form editing capability
- [ ] Response pagination/filtering
- [ ] Form templates library
- [ ] Advanced field types (date, time, file upload)
- [ ] Conditional field logic
- [ ] Form preview before publishing
- [ ] Bulk import of responses
- [ ] Response analytics dashboard
- [ ] Form versioning
- [ ] Webhook notifications

## Rollback Plan

If issues arise:
1. Delete migration files from core/migrations/
2. Remove CustomForm/CustomFormResponse from models.py
3. Remove related imports from views/serializers/urls
4. Delete new component files
5. Revert GrowthPage and App.tsx changes
6. Remove frontend routes

## Documentation

This feature follows Django REST Framework best practices:
- Proper permission classes
- Clean serializer structure
- Generic views for CRUD
- JSON-based dynamic configuration
- RESTful endpoint design

React component best practices:
- Functional components with hooks
- Type safety with TypeScript
- Proper error handling
- Loading states
- RTL layout support
