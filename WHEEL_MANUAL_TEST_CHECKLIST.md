# Wheel Feature Manual Testing Checklist

**Task**: 9. Manual testing  
**Date**: 2025-10-05  
**Requirements**: 8.1, 8.2, 8.3

## Overview

This document provides a comprehensive manual testing checklist for the Wheel of Fortune feature. Complete all tests and check off items as you verify them.

---

## Pre-Testing Setup

- [ ] Application is running (use `npm run dev`)
- [ ] Browser DevTools console is open (F12)
- [ ] No existing console errors
- [ ] Clear browser cache if needed (Ctrl+Shift+Delete)

---

## Test 1: Navigation Link (Requirement 8.1)

### Steps

1. [ ] Open the application in your browser
2. [ ] Locate the navigation bar at the top
3. [ ] Find the "🎯 Lern-Modul" link
4. [ ] Click the link

### Verification

- [ ] Link is visible in navigation
- [ ] Link has proper icon (🎯) and text
- [ ] Link is clickable
- [ ] URL changes to `#/wheel`
- [ ] Wheel page loads successfully
- [ ] No console errors appear
- [ ] Page title/header shows "🎯 Lern-Modul"

### Notes

```
Link text: ___________________
URL after click: ___________________
Any issues: ___________________
```

---

## Test 2: Wheel Spinning - First Spin (Requirement 8.2)

### Steps

1. [ ] Ensure you're on the wheel page (`#/wheel`)
2. [ ] Verify "Rad drehen" button is visible
3. [ ] Click "Rad drehen" button
4. [ ] Watch the animation

### Verification

- [ ] Animation starts immediately after click
- [ ] Module names cycle through display
- [ ] Animation is smooth (no stuttering)
- [ ] Animation duration is ~1.5-2 seconds
- [ ] Animation slows down near the end
- [ ] A module is selected and displayed
- [ ] "Rad drehen" button disappears
- [ ] "Nochmal" button appears
- [ ] "Zum Modul" button appears
- [ ] Selected module is announced (check aria-live region)
- [ ] No console errors

### Notes

```
Selected module: ___________________
Animation duration: ___________________
Any issues: ___________________
```

---

## Test 3: Wheel Spinning - Second Spin (Requirement 8.2)

### Steps

1. [ ] Click "Nochmal" button
2. [ ] Watch the animation again

### Verification

- [ ] "Nochmal" and "Zum Modul" buttons disappear during spin
- [ ] Animation works the same as first spin
- [ ] A module is selected (may be same or different)
- [ ] Buttons reappear after animation
- [ ] Selected module display updates
- [ ] No console errors

### Notes

```
Selected module: ___________________
Same as first spin? ___________________
Any issues: ___________________
```

---

## Test 4: Wheel Spinning - Third Spin (Requirement 8.2)

### Steps

1. [ ] Click "Nochmal" button again
2. [ ] Watch the animation

### Verification

- [ ] Animation works consistently
- [ ] Module is selected successfully
- [ ] All UI elements update correctly
- [ ] No performance degradation
- [ ] No console errors

### Notes

```
Selected module: ___________________
Any issues: ___________________
```

---

## Test 5: Navigate to Module (Requirement 8.3)

### Steps

1. [ ] After spinning, note the selected module name
2. [ ] Click "Zum Modul" button
3. [ ] Wait for navigation

### Verification

- [ ] URL changes to `#/modules/{module-id}`
- [ ] Module detail page loads
- [ ] Correct module content is displayed
- [ ] Module title matches selected module
- [ ] No console errors
- [ ] Can navigate back to wheel using browser back button

### Notes

```
Selected module: ___________________
Module ID in URL: ___________________
Content matches: ___________________
Any issues: ___________________
```

---

## Test 6: State Persistence

### Steps

1. [ ] Spin the wheel and select a module
2. [ ] Note the selected module name: **\*\*\*\***\_\_\_**\*\*\*\***
3. [ ] Reload the page (F5 or Ctrl+R)
4. [ ] Navigate back to wheel page (`#/wheel`)

### Verification

- [ ] Previously selected module is still displayed
- [ ] "Nochmal" and "Zum Modul" buttons are visible
- [ ] Can click "Zum Modul" to navigate to saved module
- [ ] State persists across multiple reloads
- [ ] No console errors

### Notes

```
Module before reload: ___________________
Module after reload: ___________________
State persisted correctly: ___________________
Any issues: ___________________
```

---

## Test 7: Mobile Responsiveness

### Option A: Browser DevTools

#### Steps

1. [ ] Open DevTools (F12)
2. [ ] Toggle device toolbar (Ctrl+Shift+M)
3. [ ] Select "iPhone 12" or similar device
4. [ ] Navigate to wheel page
5. [ ] Test all functionality

#### Verification - iPhone 12 (390px)

- [ ] Page layout is readable
- [ ] Wheel display is visible and sized appropriately
- [ ] Buttons are large enough to tap (min 44x44px)
- [ ] Text is legible without zooming
- [ ] Animation works smoothly
- [ ] Can spin wheel successfully
- [ ] Can navigate to module
- [ ] No horizontal scrolling
- [ ] Navigation menu works (hamburger menu)

#### Verification - Galaxy S20 (360px)

- [ ] Repeat all checks above for Galaxy S20

#### Verification - iPad (768px)

- [ ] Repeat all checks above for iPad

### Option B: Real Mobile Device

#### Steps

1. [ ] Get the app URL (e.g., `http://localhost:5173`)
2. [ ] Open on your phone's browser
3. [ ] Navigate to wheel page
4. [ ] Test all functionality

#### Verification

- [ ] All elements visible and usable
- [ ] Touch interactions work correctly
- [ ] Animation is smooth
- [ ] Can complete full workflow
- [ ] No layout issues

### Notes

```
Devices tested: ___________________
Issues found: ___________________
```

---

## Test 8: Dark Mode

### Steps

1. [ ] Navigate to wheel page in light mode
2. [ ] Note the appearance
3. [ ] Click theme toggle button (☀️/🌙)
4. [ ] Verify dark mode appearance
5. [ ] Toggle back to light mode

### Verification - Light Mode

- [ ] Wheel container has light background
- [ ] Text is dark and readable
- [ ] Buttons have appropriate styling
- [ ] Animation display is clearly visible
- [ ] Good color contrast (no strain)

### Verification - Dark Mode

- [ ] Wheel container has dark background
- [ ] Text is light and readable
- [ ] Buttons have appropriate dark styling
- [ ] Animation display is clearly visible
- [ ] Good color contrast (WCAG AA compliant)
- [ ] No "flashbang" effect (harsh white)

### Verification - Theme Switching

- [ ] Theme changes without page reload
- [ ] All elements update correctly
- [ ] Animation works in both themes
- [ ] Theme preference persists after reload
- [ ] No console errors during switch

### Notes

```
Light mode appearance: ___________________
Dark mode appearance: ___________________
Any contrast issues: ___________________
```

---

## Test 9: Edge Cases

### Empty/Insufficient Modules

1. [ ] Check behavior if modules fail to load
2. [ ] Verify appropriate error message is shown

### Rapid Clicking

1. [ ] Try clicking "Rad drehen" multiple times rapidly
2. [ ] Verify only one animation runs at a time
3. [ ] No duplicate selections or errors

### Browser Compatibility

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] Test in Edge

### Notes

```
Edge cases tested: ___________________
Issues found: ___________________
```

---

## Test 10: Accessibility

### Keyboard Navigation

1. [ ] Navigate to wheel page
2. [ ] Use Tab key to navigate through elements
3. [ ] Press Enter on "Rad drehen" button
4. [ ] Verify animation works
5. [ ] Tab to "Zum Modul" button
6. [ ] Press Enter to navigate

### Verification

- [ ] Can reach all interactive elements with Tab
- [ ] Focus indicators are visible
- [ ] Enter/Space activates buttons
- [ ] Focus returns to appropriate element after spin
- [ ] No keyboard traps

### Screen Reader (Optional)

- [ ] Enable screen reader (NVDA, JAWS, VoiceOver)
- [ ] Navigate to wheel page
- [ ] Verify announcements are made
- [ ] Verify button labels are read correctly
- [ ] Verify selected module is announced

### Notes

```
Keyboard navigation: ___________________
Screen reader tested: ___________________
Issues found: ___________________
```

---

## Test 11: Performance

### Verification

- [ ] Page loads quickly (< 2 seconds)
- [ ] Animation is smooth (60fps)
- [ ] No lag when clicking buttons
- [ ] No memory leaks (check DevTools Performance tab)
- [ ] Works well on slower devices/connections

### Notes

```
Load time: ___________________
Animation smoothness: ___________________
Any performance issues: ___________________
```

---

## Final Verification

### All Requirements Met

- [ ] ✅ 8.1: Can click wheel link in navigation
- [ ] ✅ 8.2: Can spin wheel 3 times successfully
- [ ] ✅ 8.3: Can click "Zum Modul" and navigate correctly
- [ ] ✅ State persists across page reloads
- [ ] ✅ Works on mobile devices
- [ ] ✅ Works in dark mode

### Overall Assessment

- [ ] All tests passed
- [ ] No critical issues found
- [ ] Feature is ready for production
- [ ] Documentation is complete

---

## Issues Found

### Critical Issues (Must Fix)

```
1. ___________________
2. ___________________
3. ___________________
```

### Minor Issues (Nice to Fix)

```
1. ___________________
2. ___________________
3. ___________________
```

### Suggestions for Improvement

```
1. ___________________
2. ___________________
3. ___________________
```

---

## Sign-Off

**Tester Name**: **\*\*\*\***\_\_\_**\*\*\*\***  
**Date**: **\*\*\*\***\_\_\_**\*\*\*\***  
**Time Spent**: **\*\*\*\***\_\_\_**\*\*\*\***  
**Overall Result**: ⬜ PASS / ⬜ FAIL

**Comments**:

```
___________________
___________________
___________________
```

---

## Quick Test Commands

Run these in the browser console for automated checks:

```javascript
// Load the manual testing script
const script = document.createElement('script');
script.src = '/scripts/manual-test-wheel.js';
script.type = 'module';
document.head.appendChild(script);

// After script loads, run tests
setTimeout(() => {
  const tester = new WheelManualTester();
  tester.runTests();
}, 1000);

// Check current state
console.log(
  'Last wheel module:',
  window.app?.services?.stateManager?.getState('lastWheelModule')
);

// Check current theme
console.log('Current theme:', window.app?.services?.themeManager?.getTheme());

// Check if on wheel page
console.log('Current route:', window.location.hash);
```

---

## Resources

- **Requirements**: `.kiro/specs/codebase-audit-wheel-feature/requirements.md`
- **Design**: `.kiro/specs/codebase-audit-wheel-feature/design.md`
- **Tasks**: `.kiro/specs/codebase-audit-wheel-feature/tasks.md`
- **Component**: `src/components/WheelView.js`
- **Testing Script**: `scripts/manual-test-wheel.js`

---

**End of Manual Testing Checklist**
