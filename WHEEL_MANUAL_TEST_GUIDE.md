# Wheel Feature Manual Testing Guide

**Task 9: Manual Testing**  
**Status**: Ready for Testing  
**Date**: 2025-10-05

---

## Quick Start

### 1. Start the Application

```bash
npm run dev
```

The app should start at `http://localhost:5173`

### 2. Open Testing Checklist

Open `WHEEL_MANUAL_TEST_CHECKLIST.md` in your editor and follow along.

### 3. Run Automated Setup Verification (Optional)

```bash
node scripts/verify-wheel-setup.js
```

This verifies all components are in place before manual testing.

---

## What You're Testing

### Requirements Coverage

This manual test covers the following requirements from the spec:

- **Requirement 8.1**: Validate refactoring - confirm app runs without errors
- **Requirement 8.2**: Validate features - original features function unchanged, Wheel page selectable, Wheel selection works for ≥3 consecutive spins
- **Requirement 8.3**: Validate state - last selected module persisted in StateManager

### Task Details

From `tasks.md` Task 9:

- Click wheel link in navigation
- Spin wheel 3 times
- Click "Zum Modul" and verify it navigates
- Reload page and check state persists
- Test on phone
- Test dark mode

---

## Testing Workflow

### Phase 1: Basic Functionality (15 minutes)

1. **Navigation Test**
   - Open app
   - Find "🎯 Lern-Modul" in navigation
   - Click it
   - Verify wheel page loads

2. **Spinning Test**
   - Click "Rad drehen" button
   - Watch animation (~1.5-2 seconds)
   - Verify module is selected
   - Click "Nochmal" button
   - Repeat 2 more times (total 3 spins)

3. **Navigation Test**
   - After spinning, click "Zum Modul"
   - Verify you navigate to the module page
   - Verify correct module loads

### Phase 2: State Persistence (5 minutes)

1. Spin wheel and note selected module
2. Reload page (F5)
3. Navigate back to wheel
4. Verify same module is still selected

### Phase 3: Responsive Design (10 minutes)

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on:
   - iPhone 12 (390px)
   - Galaxy S20 (360px)
   - iPad (768px)
4. Verify all functionality works on mobile

### Phase 4: Dark Mode (5 minutes)

1. Navigate to wheel page
2. Toggle dark mode (☀️/🌙 button)
3. Verify styling looks good
4. Toggle back to light mode
5. Verify styling looks good

---

## Expected Behavior

### Animation

- **Duration**: 1.5-2 seconds total
- **Phases**:
  - Fast cycling (60% of time): modules change every 60ms
  - Slow down (40% of time): progressively slower
  - Final pause: brief emphasis on selected module
- **Smoothness**: No stuttering or lag

### UI States

**Initial State:**

- "Rad drehen" button visible
- "Nochmal" and "Zum Modul" buttons hidden
- Display shows "Drücke 'Rad drehen'"

**During Spin:**

- All buttons disabled
- Module names cycle in display
- Animation running

**After Spin:**

- "Rad drehen" button hidden
- "Nochmal" button visible
- "Zum Modul" button visible
- Selected module displayed
- Focus returns to "Nochmal" button

### State Persistence

The following should persist across page reloads:

- Last selected module ID
- Last selected module title
- Last selected module category
- Timestamp of selection

Stored in: `StateManager` with key `lastWheelModule`

---

## Common Issues & Solutions

### Issue: Wheel page doesn't load

**Check:**

- Is the dev server running?
- Any console errors?
- Is the URL correct? (`#/wheel`)

**Solution:**

- Restart dev server
- Clear browser cache
- Check browser console for errors

### Issue: Animation is choppy

**Check:**

- Browser performance
- Other tabs consuming resources
- DevTools performance tab

**Solution:**

- Close other tabs
- Test in different browser
- Check if `prefers-reduced-motion` is enabled

### Issue: State doesn't persist

**Check:**

- Browser console for storage errors
- LocalStorage is enabled
- No private/incognito mode

**Solution:**

- Check browser storage settings
- Try different browser
- Check console for errors

### Issue: Dark mode styling looks wrong

**Check:**

- Theme toggle working?
- CSS loaded correctly?
- Browser cache cleared?

**Solution:**

- Hard refresh (Ctrl+Shift+R)
- Check DevTools for CSS errors
- Verify `data-theme` attribute on `<html>`

---

## Testing Checklist Summary

Use this quick checklist during testing:

```
Basic Functionality:
[ ] Navigation link works
[ ] Spin 1 completes successfully
[ ] Spin 2 completes successfully
[ ] Spin 3 completes successfully
[ ] "Zum Modul" navigates correctly

State Persistence:
[ ] State saves after spin
[ ] State loads after reload

Responsive Design:
[ ] Works on mobile (320-768px)
[ ] Touch interactions work
[ ] Layout is readable

Dark Mode:
[ ] Looks good in light mode
[ ] Looks good in dark mode
[ ] Theme toggle works

Accessibility:
[ ] Keyboard navigation works
[ ] Focus management correct
[ ] ARIA announcements work

Performance:
[ ] Page loads quickly
[ ] Animation is smooth
[ ] No console errors
```

---

## Browser Testing Matrix

Test in at least 2 browsers:

| Browser | Version | Desktop | Mobile | Status |
| ------- | ------- | ------- | ------ | ------ |
| Chrome  | Latest  | [ ]     | [ ]    |        |
| Firefox | Latest  | [ ]     | [ ]    |        |
| Safari  | Latest  | [ ]     | [ ]    |        |
| Edge    | Latest  | [ ]     | [ ]    |        |

---

## Console Commands for Testing

Open browser console and run these commands to inspect state:

### Check Current Route

```javascript
console.log('Current route:', window.location.hash);
```

### Check Last Selected Module

```javascript
const lastModule =
  window.app?.services?.stateManager?.getState('lastWheelModule');
console.log('Last wheel module:', lastModule);
```

### Check Current Theme

```javascript
const theme = window.app?.services?.themeManager?.getTheme();
console.log('Current theme:', theme);
```

### Check Available Modules

```javascript
const modules = await window.app?.services?.ihkContentService?.searchContent(
  '',
  {}
);
console.log('Available modules:', modules.length);
```

### Manually Trigger Spin (for debugging)

```javascript
// Navigate to wheel first, then:
const spinBtn = document.querySelector('#btn-spin');
if (spinBtn) spinBtn.click();
```

---

## Reporting Issues

If you find issues during testing, document them with:

1. **Issue Title**: Brief description
2. **Severity**: Critical / Major / Minor
3. **Steps to Reproduce**: Exact steps
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happens
6. **Browser/Device**: Where it occurs
7. **Screenshots**: If applicable
8. **Console Errors**: Any error messages

### Example Issue Report

```
Title: Animation stutters on mobile Safari
Severity: Minor
Steps:
  1. Open app on iPhone 12 Safari
  2. Navigate to wheel page
  3. Click "Rad drehen"
  4. Observe animation
Expected: Smooth animation
Actual: Animation stutters every few frames
Browser: Safari 17.1 on iOS 17.2
Console: No errors
```

---

## Success Criteria

Task 9 is complete when:

- [ ] All items in `WHEEL_MANUAL_TEST_CHECKLIST.md` are checked
- [ ] No critical issues found
- [ ] All 3 spins work successfully
- [ ] Navigation to module works
- [ ] State persists across reloads
- [ ] Works on mobile devices
- [ ] Works in dark mode
- [ ] No console errors during testing

---

## Next Steps After Testing

1. **If all tests pass:**
   - Mark Task 9 as complete
   - Update tasks.md
   - Document any minor issues for future improvement
   - Consider Task 10 (Fix any bugs found)

2. **If issues found:**
   - Document all issues
   - Prioritize by severity
   - Fix critical issues first
   - Re-test after fixes

---

## Resources

- **Checklist**: `WHEEL_MANUAL_TEST_CHECKLIST.md` (detailed checklist)
- **Testing Script**: `scripts/manual-test-wheel.js` (automated checks)
- **Setup Verification**: `scripts/verify-wheel-setup.js` (pre-test checks)
- **Component**: `src/components/WheelView.js` (implementation)
- **Styles**: `src/style.css` (search for `.wheel-`)
- **Requirements**: `.kiro/specs/codebase-audit-wheel-feature/requirements.md`
- **Design**: `.kiro/specs/codebase-audit-wheel-feature/design.md`
- **Tasks**: `.kiro/specs/codebase-audit-wheel-feature/tasks.md`

---

## Tips for Effective Testing

1. **Take Your Time**: Don't rush through the tests
2. **Be Thorough**: Check every item in the checklist
3. **Document Everything**: Note even minor issues
4. **Test Edge Cases**: Try unusual interactions
5. **Use Multiple Browsers**: Different browsers may behave differently
6. **Test on Real Devices**: Emulators don't catch everything
7. **Check Accessibility**: Try keyboard-only navigation
8. **Monitor Console**: Keep DevTools open for errors
9. **Clear Cache**: If something seems wrong, try hard refresh
10. **Ask Questions**: If unsure about expected behavior, check the design doc

---

**Happy Testing! 🎯**

Remember: The goal is to ensure the wheel feature works reliably for all users across all devices and scenarios.
