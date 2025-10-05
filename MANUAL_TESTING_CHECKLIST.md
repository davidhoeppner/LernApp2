# Manual Testing Checklist - Content Cleanup Fix

This document provides a comprehensive checklist for manually testing and verifying all fixes applied during the content cleanup process.

## Prerequisites

Before starting the tests, ensure:
- ✅ All automated tasks (1-6) have been completed
- ✅ Final validation report shows all checks passed
- ✅ No uncommitted changes that could affect testing

## Starting the Development Server

### Step 1: Verify the Fix is Applied

Before starting, verify the markdown fix is in the code:

```bash
node scripts/verify-markdown-fix.js
```

**Expected Result**: Should show ✅ VERIFICATION PASSED

### Step 2: Start the Server

Run the following command in your terminal:

```bash
npm run dev
```

The application should start on `http://localhost:5173` (or another port if 5173 is busy).

**Expected Result**: Server starts without errors, and you can access the application in your browser.

### Step 3: Clear Browser Cache (IMPORTANT!)

**Before testing, you MUST clear your browser cache** to see the markdown rendering fix:

**Windows/Linux**: Press `Ctrl + Shift + R` (hard refresh)  
**Mac**: Press `Cmd + Shift + R` (hard refresh)

OR:

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Why?** The browser caches JavaScript files. Without clearing cache, you'll see the old broken version.

**Expected Result**: Page reloads and fetches fresh JavaScript files.

---

## Test 1: UTF-8 Encoding & Content Formatting Verification

### Test 1.1: FÜ-04 Security Module
1. Navigate to the IHK section
2. Find and click on the **FÜ-04 Security** module
3. Verify the following German characters display correctly:

**Check these specific items:**
- [ ] Module title shows "FÜ-04" (not "FÃœ-04")
- [ ] Word "Maßnahmen" displays correctly (not "MaÃŸnahmen")
- [ ] All umlauts (ü, ö, ä) display correctly throughout the content
- [ ] Capital umlauts (Ü, Ö, Ä) display correctly
- [ ] Special character ß (eszett) displays correctly

**Expected Result**: All German characters render properly with no garbled "Ã" sequences visible.

### Test 1.2: Content Formatting
While viewing the FÜ-04 Security module, verify proper markdown rendering:

- [ ] Headers display in different sizes (h1, h2, h3, h4)
- [ ] Paragraphs are separated with proper spacing
- [ ] Lists display as bullet points (not as "- item")
- [ ] Bold text appears bold (e.g., "**Definition**")
- [ ] Content is readable and well-structured (not one blob of text)
- [ ] Code examples (if any) are in code blocks

**Expected Result**: Content is properly formatted with clear visual hierarchy.

### Test 1.3: Other Modules with German Content
Test additional modules that may contain German characters and formatting:

- [ ] **FÜ-01 Planning** - Check category label "FÜ-01" and content formatting
- [ ] **FÜ-02 Development** - Check category label "FÜ-02" and content formatting
- [ ] **FÜ-03 Quality** - Check category label "FÜ-03" and content formatting
- [ ] **BP-01 Conception** - Check for any German terms and content formatting
- [ ] **BP-02 Infrastructure** - Check for any German terms and content formatting

**Expected Result**: All modules display German characters correctly AND content is properly formatted (not one blob of text).

---

## Test 2: Module Category Navigation

### Test 2.1: FÜ Category Modules
Navigate to each FÜ (Fachqualifikationen Ü) module:

- [ ] FÜ-01 Planning - Page loads successfully
- [ ] FÜ-02 Development - Page loads successfully
- [ ] FÜ-02 Control Structures - Page loads successfully
- [ ] FÜ-02 Anomalies & Redundancies - Page loads successfully
- [ ] FÜ-03 Quality - Page loads successfully
- [ ] FÜ-03 Load & Performance Tests - Page loads successfully
- [ ] FÜ-04 Security - Page loads successfully
- [ ] FÜ-04 Security Threats - Page loads successfully

**Expected Result**: All FÜ modules load without errors.

### Test 2.2: BP Category Modules
Navigate to each BP (Berufspraktische Qualifikationen) module:

- [ ] BP-01 Conception - Page loads successfully
- [ ] BP-01 Documentation - Page loads successfully
- [ ] BP-01 Monitoring - Page loads successfully
- [ ] BP-01 Kerberos - Page loads successfully
- [ ] BP-02 Data Formats - Page loads successfully
- [ ] BP-02 Cloud Models - Page loads successfully
- [ ] BP-02 NAS/SAN - Page loads successfully
- [ ] BP-03 REST API - Page loads successfully
- [ ] BP-03 Software Quality - Page loads successfully
- [ ] BP-03 CPS - Page loads successfully
- [ ] BP-03 TDD - Page loads successfully
- [ ] BP-04 Design Patterns - Page loads successfully
- [ ] BP-04 Architecture Patterns - Page loads successfully
- [ ] BP-04 Programming Paradigms - Page loads successfully
- [ ] BP-04 Scrum - Page loads successfully
- [ ] BP-05 Data Structures - Page loads successfully
- [ ] BP-05 Encapsulation - Page loads successfully
- [ ] BP-05 SQL Reference - Page loads successfully
- [ ] BP-05 Sorting - Page loads successfully

**Expected Result**: All BP modules load without errors.

### Test 2.3: SQL Modules
Navigate to SQL-specific modules:

- [ ] SQL DDL - Page loads successfully
- [ ] SQL DML - Page loads successfully
- [ ] SQL DQL - Page loads successfully

**Expected Result**: All SQL modules load without errors.

---

## Test 3: Internal Links Verification

### Test 3.1: Prerequisites Links
For modules with prerequisites, verify the links work:

1. Open **BP-02 NAS/SAN** module
   - [ ] Click on any prerequisite module link
   - [ ] Verify it navigates to the correct module

2. Open **BP-03 REST API** module
   - [ ] Click on any prerequisite module link
   - [ ] Verify it navigates to the correct module

3. Open **BP-04 Design Patterns** module
   - [ ] Click on any prerequisite module link
   - [ ] Verify it navigates to the correct module

**Expected Result**: All prerequisite links navigate to valid, existing modules.

### Test 3.2: Related Quizzes Links
For modules with related quizzes, verify the links work:

1. Open **FÜ-04 Security** module
   - [ ] Click on "Related Quizzes" link
   - [ ] Verify it navigates to the correct quiz

2. Open **BP-01 Conception** module
   - [ ] Click on "Related Quizzes" link
   - [ ] Verify it navigates to the correct quiz

3. Open **BP-05 SQL Reference** module
   - [ ] Click on "Related Quizzes" link
   - [ ] Verify it navigates to the correct quiz

**Expected Result**: All quiz links navigate to valid, existing quizzes.

### Test 3.3: Learning Path Links
Test learning path navigation:

1. Navigate to **Learning Paths** section
   - [ ] Open "AP2 Complete Path"
   - [ ] Click on module links within the path
   - [ ] Verify all modules load correctly

2. Open "New Topics 2025 Path"
   - [ ] Click on module links within the path
   - [ ] Verify all modules load correctly

3. Open "OOP Fundamentals Path"
   - [ ] Click on module links within the path
   - [ ] Verify all modules load correctly

**Expected Result**: All learning path module links work correctly.

---

## Test 4: Browser Console Verification

### Test 4.1: Console Errors Check
With the browser developer tools open (F12):

1. Navigate to the home page
   - [ ] Check console - no errors should appear

2. Navigate to IHK Overview
   - [ ] Check console - no errors should appear

3. Navigate to a module (e.g., FÜ-04 Security)
   - [ ] Check console - no errors should appear

4. Navigate to a quiz
   - [ ] Check console - no errors should appear

5. Use the search functionality
   - [ ] Check console - no errors should appear

**Expected Result**: No JavaScript errors, 404 errors, or warnings in the console.

### Test 4.2: Network Tab Check
In the Network tab of developer tools:

1. Reload the application
   - [ ] All JSON files load successfully (200 status)
   - [ ] No 404 errors for missing files
   - [ ] No failed requests

**Expected Result**: All resources load successfully.

---

## Test 5: Workspace Organization Verification

### Test 5.1: Root Directory Cleanup
Check the root directory for unnecessary files:

- [ ] No `TASK_*_SUMMARY.md` files in root
- [ ] No `*_FIXED.md` or `*_FIX.md` files
- [ ] No duplicate deployment docs (only `DEPLOYMENT.md` should exist)
- [ ] No temporary analysis reports (`.json` files)
- [ ] No quiz migration reports in root

**Expected Result**: Root directory contains only essential documentation.

### Test 5.2: Essential Files Present
Verify essential documentation is still present:

- [ ] `README.md` exists
- [ ] `LICENSE` exists
- [ ] `DEPLOYMENT.md` exists
- [ ] `ERROR_HANDLING_GUIDE.md` exists
- [ ] `ACCESSIBILITY_*.md` files exist
- [ ] `RESPONSIVE_*.md` files exist
- [ ] `.deployment-checklist.md` exists

**Expected Result**: All essential documentation is preserved.

### Test 5.3: Spec Directory Organization
Check `.kiro/specs/` directory:

- [ ] Each spec has `requirements.md`, `design.md`, `tasks.md`
- [ ] No `TASK_*_SUMMARY.md` files in spec directories
- [ ] Spec directories are well-organized

**Expected Result**: Spec directories are clean and organized.

---

## Test 6: Functional Testing

### Test 6.1: Search Functionality
1. Use the search bar to search for "security"
   - [ ] Results appear correctly
   - [ ] German characters in results display correctly
   - [ ] Clicking a result navigates to the correct module

2. Search for "SQL"
   - [ ] All SQL-related modules appear
   - [ ] Results are clickable and functional

**Expected Result**: Search works correctly with proper encoding.

### Test 6.2: Filter Functionality
1. Use category filters (if available)
   - [ ] Filter by FÜ category
   - [ ] Filter by BP category
   - [ ] Filters work correctly

**Expected Result**: Filtering works as expected.

### Test 6.3: Progress Tracking
1. Mark a module as complete
   - [ ] Progress updates correctly
   - [ ] Progress persists after page reload

**Expected Result**: Progress tracking functions properly.

---

## Test 7: Responsive Design Check

### Test 7.1: Mobile View
1. Open browser developer tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on mobile viewport (375px width)
   - [ ] Navigation works on mobile
   - [ ] Module content is readable
   - [ ] German characters display correctly
   - [ ] No horizontal scrolling issues

**Expected Result**: Application is fully functional on mobile.

### Test 7.2: Tablet View
Test on tablet viewport (768px width):
   - [ ] Layout adapts appropriately
   - [ ] All functionality works
   - [ ] Content is readable

**Expected Result**: Application works well on tablet.

---

## Test 8: Accessibility Check

### Test 8.1: Keyboard Navigation
1. Use Tab key to navigate through the application
   - [ ] All interactive elements are reachable
   - [ ] Focus indicators are visible
   - [ ] Tab order is logical

2. Use Enter/Space to activate buttons and links
   - [ ] All controls work with keyboard

**Expected Result**: Full keyboard accessibility.

### Test 8.2: Screen Reader Test (Optional)
If you have a screen reader available:
   - [ ] Module titles are announced correctly
   - [ ] Navigation is understandable
   - [ ] German characters are pronounced correctly

**Expected Result**: Screen reader compatibility.

---

## Final Verification Checklist

Before marking the task as complete, ensure:

- [ ] All UTF-8 encoding issues are fixed (no "Ã" sequences visible)
- [ ] All module categories (FÜ-01 through BP-05) are accessible
- [ ] All internal links (prerequisites, related quizzes) work correctly
- [ ] Browser console shows no errors
- [ ] Workspace is clean and organized
- [ ] Application is fully functional
- [ ] No broken navigation or dead links
- [ ] Search and filter functionality works
- [ ] Progress tracking works
- [ ] Responsive design works on all screen sizes

---

## Reporting Issues

If you find any issues during testing:

1. **Document the issue**:
   - What you were doing
   - What you expected to happen
   - What actually happened
   - Screenshot if applicable

2. **Check the console**:
   - Copy any error messages
   - Note the file and line number

3. **Create a list of issues** to address before marking the task complete

---

## Completion

Once all tests pass:

1. Stop the development server (Ctrl+C in terminal)
2. Mark task 7 as complete in `tasks.md`
3. Consider committing all changes with a descriptive message
4. The content cleanup fix spec is now complete! 🎉

---

## Quick Reference Commands

```bash
# Start development server
npm run dev

# Run final validation
npm run validate:final

# Check encoding
npm run validate:encoding

# Validate all modules
npm run validate:all
```
