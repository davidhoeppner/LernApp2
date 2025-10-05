# Implementation Plan

Simple, practical plan to fix issues and add the Wheel of Fortune feature. No overhead, just get it working.

## Quick Cleanup

- [x] 1. Quick code cleanup
  - Run `npm run lint:fix` to auto-fix formatting
  - Manually remove any obvious unused imports (check console warnings)
  - Remove any commented-out code blocks
  - Test app still runs: `npm run dev`
  - _Requirements: 3.1, 3.2_

## Build Wheel Feature

-

- [x] 2. Create WheelView component
  - Create `src/components/WheelView.js`
  - Load modules from IHKContentService
  - Implement simple random selection
  - Create basic UI with "Spin" button
  - Display selected module
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_

- [x] 3. Add wheel animation
  - Create simple cycling animation (text-based is fine)

  - Cycle through ~10-15 modules quickly

  - Slow down and stop at selected module
  - Keep animation under 2 seconds
  - _Requirements: 5.4, 6.4, 6.12_

- [x] 4. Add wheel UI controls
  - Add "Rad drehen" button to start spin
  - Add "Nochmal" button to spin again
  - Add "Zum Modul" button to navigate to selected module

  - Show selected module title and category
  - _Requirements: 5.5, 5.6, 6.5_

- [x] 5. Save wheel state
  - Save last selected module to StateManager
  - Use key `lastWheelModule`
  - Handle errors gracefully (just log, don't crash)
  - _Requirements: 5.9, 6.6_

-

- [x] 6. Style the wheel
  - Add CSS for wheel component in `src/style.css`
  - Make it look good in light and dark mode
  - Make it work on mobile
  - Keep it simple - no fancy graphics needed
  - _Requirements: 6.11_

- [x] 7. Add wheel to navigation

  - Update `src/components/Navigation.js`
  - Add "🎯 Lern-Modul" link
  - Register `/wheel` route in `src/app.js`
  - Wire up WheelView component
  - _Requirements: 5.10, 6.1_

- [x] 8. Add basic accessibility

  - Add aria-label to spin button
  - Add aria-live region for announcing result
  - Make sure keyboard navigation works (Tab, Enter)
  - _Requirements: 5.7, 5.8_

## Test It Works
-

- [x] 9. Manual testing


  - Click wheel link in navigation
  - Spin wheel 3 times
  - Click "Zum Modul" and verify it navigates
  - Reload page and check state persists
  - Test on phone
  - Test dark mode
  - _Requirements: 8.1, 8.2, 8.3_








- [x] 10. Fix any bugs found
  - Fix issues discovered during testing
  - Make sure nothing broke in existing features
  - _Requirements: 8.1_

---

**Total Tasks**: 10 simple tasks  
**Estimated Time**: 4-6 hours  
**Goal**: Working wheel feature, no broken stuff
