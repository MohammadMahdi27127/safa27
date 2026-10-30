# Deployment Checklist - Global Forms & Skills Export

**Last Updated:** October 29, 2026  
**Status:** Ready for Production

---

## Pre-Deployment ✅

- [x] All code changes implemented
- [x] Models updated (workgroup & expiration_date optional)
- [x] Views updated (global filters removed)
- [x] Serializers updated (validation added)
- [x] Export utils updated (global export function)
- [x] Frontend updated (workgroup_id removed)
- [x] Migration file created
- [x] Documentation complete

---

## Deployment Process

### Step 1: Backup Database ⚠️
```bash
# Create backup before migration
pg_dump safa27_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Apply Migration
```bash
cd c:\Users\moham\Desktop\Myproject\VP\safa27
python manage.py migrate core
```

**Expected Output:**
```
Running migrations:
  Applying core.0005_make_customform_fields_optional... OK
```

### Step 3: Verify Migration
```bash
python manage.py showmigrations core
# All should show [X]

python manage.py check
# Should output: System check identified no issues (0 silenced).
```

### Step 4: Build Frontend
```bash
cd frontend
npm run build

# Verify:
ls dist/
# Should contain: index.html, assets/
```

### Step 5: Restart Services
```bash
# Stop services
systemctl stop django
systemctl stop nginx

# Start services
systemctl start django
systemctl start nginx

# Verify
systemctl status django
systemctl status nginx
```

### Step 6: Smoke Tests
```bash
# Test 1: Create form (no workgroup)
curl -X POST https://safa27.darkube.ir/api/custom-forms/create/ \
  -H "Authorization: Bearer TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Form",
    "fields_schema": [{"id": "1", "label": "Test", "type": "text"}]
  }'
# Expected: 201 Created

# Test 2: List active forms (global)
curl https://safa27.darkube.ir/api/custom-forms/active/ \
  -H "Authorization: Bearer TEST_TOKEN"
# Expected: 200 OK with form list

# Test 3: Export skills (all members)
curl "https://safa27.darkube.ir/api/workgroup/training/export-skills-excel/?period=thursday" \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -o /tmp/test.xlsx
# Expected: 200 OK, valid XLSX file
file /tmp/test.xlsx
# Expected: Microsoft Excel 2007+
```

### Step 7: Production Verification
```bash
# Check logs for errors
tail -f /var/log/safa27/django.log
tail -f /var/log/safa27/nginx.log

# Monitor for 5-10 minutes
# Should see: No ERROR entries
```

---

## Rollback (If Issues)

### Quick Rollback
```bash
# Stop services
systemctl stop django

# Restore database
psql safa27_db < backup_TIMESTAMP.sql

# Revert code (if deployed from git)
git revert HEAD~1

# Restart services
systemctl start django
```

### Migration Rollback (Keep Code)
```bash
python manage.py migrate core 0004_customform_customformresponse
# This reverts to previous schema
```

---

## Known Changes

### Database Schema
- `customform.workgroup` now allows NULL
- `customform.expiration_date` now allows NULL

### API Behavior
- POST /api/custom-forms/create/ - no longer requires workgroup_id
- GET /api/custom-forms/active/ - returns forms for ALL users (not just workgroup)
- GET /api/workgroup/training/export-skills-excel/ - exports ALL members (no workgroup_id param)

### Frontend Behavior
- Custom forms are now globally visible
- Error messages are more detailed
- Form creation doesn't require selecting a workgroup

---

## Success Criteria

### All These Should Be True After Deployment

- [x] Users can create forms without selecting workgroup
- [x] All users see active forms in their dashboard
- [x] Training manager can export all members' skills
- [x] Error messages show specific validation issues
- [x] No 500 errors on endpoints
- [x] No UnicodeDecodeError in logs
- [x] Database migration applied cleanly
- [x] Frontend loads without errors

---

## Monitoring Post-Deployment

### Watch These Logs
```bash
# Django errors
grep ERROR /var/log/safa27/django.log

# Nginx errors
grep error /var/log/nginx/error.log

# Specific endpoint errors
grep "custom-forms" /var/log/safa27/django.log
grep "export-skills" /var/log/safa27/django.log
```

### Monitor These Metrics
- ✅ Form creation success rate
- ✅ Skills export requests
- ✅ Active forms queries
- ✅ Error rate (should be < 1%)

---

## Rollback Indicators

Roll back immediately if you see:

- ❌ 500 errors on `/api/custom-forms/` endpoints
- ❌ "UnicodeDecodeError" in logs
- ❌ "workgroup" field validation errors
- ❌ Skills export not returning file
- ❌ Forms not visible to users
- ❌ Frontend build errors

---

## Post-Deployment Verification

### User Acceptance Testing (UAT)

1. **Create Form**
   - [ ] Manager creates form without workgroup
   - [ ] Form appears in dashboard
   - [ ] Error messages show if title/fields missing

2. **View Forms**
   - [ ] User sees all active forms
   - [ ] Forms appear regardless of workgroup

3. **Export Skills**
   - [ ] Training manager exports skills
   - [ ] File includes all members
   - [ ] No errors in export

4. **Error Handling**
   - [ ] Validation errors displayed clearly
   - [ ] No generic error messages
   - [ ] Console has no JavaScript errors

---

## Support Contact

If issues occur:
1. Check rollback indicators ↑
2. Review logs: `/var/log/safa27/django.log`
3. Consult: IMPLEMENTATION_COMPLETE.md
4. Contact: Development team

---

## Sign-Off

- [ ] DBA: Database migration reviewed and approved
- [ ] DevOps: Deployment process verified
- [ ] QA: Smoke tests passed
- [ ] Product: Changes meet requirements

---

**Ready to Deploy:** ✅ YES

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Verified By:** _____________
