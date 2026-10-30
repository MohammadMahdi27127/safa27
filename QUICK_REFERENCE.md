# Quick Reference - Global Forms & Skills Export

**TL;DR:** All changes implemented. Ready to deploy. See DEPLOYMENT_CHECKLIST.md for steps.

---

## What Changed

| Component | Before | After |
|-----------|--------|-------|
| **Form Creation** | Required workgroup | Optional workgroup ✅ |
| **Form Visibility** | Workgroup only | All users ✅ |
| **Expiration** | Required date | Optional (never expires) ✅ |
| **Skills Export** | One workgroup | All members ✅ |
| **Error Messages** | Generic | Specific ✅ |
| **File Download** | Error 500 | Works ✅ |

---

## Deploy in 3 Steps

```bash
# 1. Apply migration
python manage.py migrate core

# 2. Build frontend
cd frontend && npm run build

# 3. Restart
systemctl restart django
```

---

## Key Endpoints

```bash
# Create form (no workgroup needed)
POST /api/custom-forms/create/
{
  "title": "Form Name",
  "fields_schema": [{...}],
  "expiration_date": "2026-12-31T23:59:59Z"  # Optional
}

# Get forms (now global)
GET /api/custom-forms/active/
→ Returns all active forms for ALL users ✅

# Export skills (all members)
GET /api/workgroup/training/export-skills-excel/?period=thursday
→ Exports ALL members (no workgroup_id param) ✅
```

---

## Files Changed

| File | What | Why |
|------|------|-----|
| `core/models.py` | workgroup nullable | Global forms |
| `core/serializers.py` | Added validation | Better errors |
| `core/views.py` | Removed filters | All users see forms |
| `core/export_utils.py` | New function | Export all members |
| `frontend/CustomFormBuilderCard.tsx` | Removed workgroup_id | Global forms |
| `core/migrations/0005_...py` | New migration | Apply to DB |

---

## Verify Deployment

```bash
# Create form (no error about workgroup)
curl -X POST https://safa27.darkube.ir/api/custom-forms/create/ \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title": "Test", "fields_schema": [{}]}'
→ Expected: 201 Created ✅

# List forms (all visible)
curl https://safa27.darkube.ir/api/custom-forms/active/ \
  -H "Authorization: Bearer TOKEN"
→ Expected: 200 OK ✅

# Export skills (all members)
curl "https://safa27.darkube.ir/api/workgroup/training/export-skills-excel/?period=thursday" \
  -H "Authorization: Bearer MANAGER_TOKEN" -o report.xlsx
→ Expected: Valid XLSX file ✅
```

---

## Rollback (If Needed)

```bash
# Revert migration
python manage.py migrate core 0004_customform_customformresponse

# Revert code
git revert HEAD~1

# Restart
systemctl restart django
```

---

## Support

| Issue | Solution |
|-------|----------|
| Form creation fails | Check error message - likely title/fields invalid |
| Forms not visible | Check is_active=True and expiration_date |
| Export returns error | Verify user is training manager (code 27118) |
| File download error | Was UnicodeDecodeError - now fixed with HttpResponse |

---

## Migration Details

**Migration:** `0005_make_customform_fields_optional.py`

**Changes:**
- `customform.workgroup` → null=True, blank=True
- `customform.expiration_date` → null=True, blank=True

**Apply:**
```bash
python manage.py migrate core
```

**Verify:**
```bash
python manage.py showmigrations core
# All should show [X]
```

---

## New Features

✅ **Global Forms**
- All authenticated users see active forms
- Forms visible regardless of workgroup

✅ **Optional Workgroup**
- Create forms without selecting workgroup
- Forms default to global (workgroup=null)

✅ **Optional Expiration**
- Forms can remain active indefinitely
- No expiration = never expires automatically

✅ **Global Skills Export**
- Training manager exports all members
- No need to select workgroup
- File includes every user

✅ **Better Errors**
- Specific validation messages
- No more generic errors
- Backend details in responses

---

## Files to Review

1. **IMPLEMENTATION_COMPLETE.md** - Full details
2. **DEPLOYMENT_CHECKLIST.md** - Step-by-step
3. **GLOBAL_FORMS_AND_SKILLS_MIGRATION.md** - API docs
4. **FINAL_SUMMARY.md** - Executive summary

---

## Deployment Checklist

- [ ] Read DEPLOYMENT_CHECKLIST.md
- [ ] Backup database
- [ ] Apply migration
- [ ] Build frontend
- [ ] Restart services
- [ ] Run smoke tests
- [ ] Monitor logs
- [ ] User UAT
- [ ] Done ✅

---

## Status

🟢 **READY FOR PRODUCTION**

- All code complete
- All tests passing
- Documentation complete
- Migration ready
- No known issues

**Next:** Follow DEPLOYMENT_CHECKLIST.md

---

## Contact

**Questions?** See IMPLEMENTATION_COMPLETE.md for detailed answers.

**Issues?** See DEPLOYMENT_CHECKLIST.md rollback section.

**Details?** See FINAL_SUMMARY.md for comprehensive information.

---

**Last Updated:** October 29, 2026  
**Status:** ✅ COMPLETE & READY
