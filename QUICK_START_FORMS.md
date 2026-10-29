# 🚀 Quick Start Guide - Custom Forms Feature

## What's New?

A complete **Dynamic Form Builder** system where workgroup leaders can create custom forms and collect responses from members with Excel export capability.

---

## 🎯 For Workgroup Leaders

### Accessing Form Manager

1. **Navigate to Form Manager:**
   - Go to `/form-manager`
   - Or from dashboard, add a link to this page

2. **Create a New Form:**
   - Click the **"+"** button (top right)
   - Fills in form details:
     - **Title:** Required (e.g., "Weekly Feedback")
     - **Description:** Optional
     - **Export Interval:** SELECT ONE (3, 5, or 7 days)
     - **Expiration Date:** SELECT DATE when form closes

3. **Add Form Fields:**
   - Click "افزودن فیلد" button
   - Enter field label: e.g., "How was your week?"
   - Choose field type:
     - `text` - Single line input
     - `textarea` - Multi-line input
     - `number` - Numeric only
     - `select` - Dropdown list
     - `radio` - Single choice buttons
     - `checkbox` - Multi-choice checkboxes
   - Mark as required if needed
   - For choice fields, add options (one per line)
   - Click "Add" or "Save Changes"

4. **Publish Form:**
   - Review fields in the list
   - Click **"✨ منتشر کردن فرم"** button
   - Success message appears

### Managing Forms

- **View Forms:** List shows all your forms
- **Export to Excel:** Click "صادرات" button (if form has responses)
- **Delete Form:** Click "حذف" to remove
- **Edit:** Coming soon feature

---

## 📋 For Workgroup Members

### Submitting a Form

1. **Go to Growth Page:**
   - Navigate to `/growth` (Personal Growth)

2. **Find Custom Form Section:**
   - Scroll down below Personal Growth card
   - Look for "فرم‌های سفارشی" section

3. **Fill Out Active Form:**
   - Read form title and description
   - Fill in all fields marked with *
   - For choice fields, select your option(s)
   - Validation happens in real-time

4. **Submit Response:**
   - Click **"ارسال پاسخ‌ها"** button
   - Wait for success message
   - Message: "پاسخ‌های شما با موفقیت ثبت شد ✨"

5. **Update Response:**
   - You can resubmit to update your response
   - Works until form expires

### Form Status

- ✅ **Active form:** Can fill out and submit
- ⏰ **Expired form:** Shows message "این فرم انقضا شده است"
- 🚫 **No active forms:** Shows "هیچ فرم فعالی وجود ندارد"

---

## 📊 Excel Export Details

When you export responses to Excel:

✅ **What's included:**
- Form title and metadata
- Export interval and expiration date
- Each respondent's:
  - Full name
  - Group code
  - Submission date/time
  - All their answers

✅ **Format:**
- Professional .xlsx file
- RTL support (Persian text)
- Formatted headers
- Proper borders and alignment
- Auto-sized columns

✅ **File name:**
- `{FormTitle}_{Timestamp}.xlsx`
- Example: `Weekly_Feedback_20261029_143025.xlsx`

---

## ⚙️ Field Types Quick Reference

| Type | Example | Use Case |
|------|---------|----------|
| **text** | "John Doe" | Name, email, short text |
| **textarea** | Multi-line text | Comments, feedback, long text |
| **number** | "42" | Age, scores, quantities |
| **select** | Dropdown menu | Choose 1 from list |
| **radio** | O Option 1, O Option 2 | Single choice buttons |
| **checkbox** | ☑ Option 1, ☑ Option 2 | Multiple choices |

---

## 💡 Example: Create a Weekly Feedback Form

### Step 1: Basic Info
```
Title: Weekly Progress Report
Description: Share your weekly achievements and challenges
Export Interval: 7 days (select via radio button)
Expiration Date: 2024-12-31 (pick via date picker)
```

### Step 2: Add Fields

**Field 1:** "What did you accomplish?"
- Type: textarea
- Required: Yes
- Placeholder: "Describe your achievements"

**Field 2:** "Rate your progress"
- Type: radio
- Required: Yes
- Options:
  ```
  Excellent
  Good
  Fair
  Needs Improvement
  ```

**Field 3:** "Which areas need improvement?"
- Type: checkbox
- Required: No
- Options:
  ```
  Time Management
  Technical Skills
  Communication
  Team Collaboration
  ```

**Field 4:** "Optional comments"
- Type: textarea
- Required: No
- Placeholder: "Any additional feedback"

### Step 3: Publish
- Review fields
- Click publish button
- Form ready for members!

---

## 🔍 Troubleshooting

### Can't create a form?
- ✅ Make sure you're logged in as workgroup leader
- ✅ Fill in all required fields (title, interval, date)
- ✅ Add at least one field

### Form doesn't appear for users?
- ✅ Check expiration date is in the future
- ✅ Check users are in the same workgroup
- ✅ Refresh page to see latest forms

### Can't download Excel?
- ✅ Form must have at least 1 response
- ✅ Make sure you're the form creator
- ✅ Check export button is enabled

### Responses not showing?
- ✅ Make sure form isn't expired
- ✅ Check you're in correct workgroup
- ✅ Try refreshing the page

---

## 📱 Mobile Friendly?

Yes! The form interface is responsive:
- Works on phones (vertical layout)
- Works on tablets (optimized grid)
- Works on desktop (full layout)

---

## 🔒 Privacy & Security

- ✅ Only workgroup leaders can create forms
- ✅ Forms only visible to their workgroup
- ✅ One response per person (can't submit twice)
- ✅ Can resubmit to update before expiration
- ✅ Data stored securely in database

---

## 📞 Need Help?

**Common Questions:**

**Q: Can users see other people's responses?**
A: No. Each person's response is private. Only leaders see all responses in export.

**Q: What happens after form expires?**
A: Form becomes read-only. Users see "expired" message. Cannot submit new responses.

**Q: Can I edit a form after publishing?**
A: Not yet - delete and recreate for now. Edit feature coming soon.

**Q: How long are responses stored?**
A: Indefinitely. Only leader can delete.

**Q: Can I have branching logic (conditional fields)?**
A: Not yet. All fields always shown. Future enhancement.

**Q: What's the difference between export intervals?**
A: Controls data grouping window (3, 5, or 7 days). All responses still included in export.

---

## 🎉 Quick Links

- **Form Manager:** `/form-manager`
- **Growth Page:** `/growth`
- **Dashboard:** `/dashboard`
- **Full Documentation:** See `CUSTOM_FORMS_FEATURE.md`

---

## 📝 Key Dates

- **Created:** October 29, 2026
- **Status:** ✅ Production Ready
- **Last Updated:** October 29, 2026

---

**Happy form building! 🚀**
