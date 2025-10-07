# Accessibility Quick Reference Guide

## For Developers

### Using the AccessibilityHelper

```javascript
import accessibilityHelper from './utils/AccessibilityHelper.js';

// Initialize (done automatically in app.js)
accessibilityHelper.init();

// Announce to screen readers
accessibilityHelper.announce('Quiz completed successfully!');
accessibilityHelper.announce('Error occurred', 'assertive');

// Focus management
accessibilityHelper.setFocus('#main-content');
accessibilityHelper.saveFocus();
accessibilityHelper.restoreFocus();

// Keyboard navigation for lists
accessibilityHelper.setupListNavigation(container, '.list-item');

// Make element keyboard accessible
accessibilityHelper.makeKeyboardAccessible(element, () => {
  // Handle click/enter/space
});

// Check motion preference
if (accessibilityHelper.prefersReducedMotion()) {
  // Skip animations
}

// Get appropriate duration
const duration = accessibilityHelper.getAnimationDuration(300);
```

### ARIA Attributes Checklist

#### Navigation

```html
<nav role="navigation" aria-label="Main navigation">
  <a href="#/" aria-current="page">Home</a>
  <button aria-label="Toggle menu" aria-expanded="false" aria-controls="menu-id">
</nav>
```

#### Main Content

```html
<main id="main-content" role="main" aria-label="Page content">
  <h1>Page Title</h1>
</main>
```

#### Progress Bars

```html
<div
  role="progressbar"
  aria-valuenow="50"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-label="Progress: 50%"
></div>
```

#### Lists

```html
<div role="list" aria-label="Module list">
  <article role="listitem">...</article>
</div>
```

#### Buttons

```html
<button aria-label="Start learning module: JavaScript Basics">
  Start Module
</button>
```

#### Forms

```html
<fieldset>
  <legend>Select your answer</legend>
  <label>
    <input type="radio" id="option-1" aria-label="Option A" />
    <span>Option A</span>
  </label>
</fieldset>
```

#### Live Regions

```html
<div role="alert" aria-live="polite">Success message</div>
```

#### Decorative Elements

```html
<span aria-hidden="true">🎉</span>
```

### CSS Classes

#### Screen Reader Only

```html
<span class="sr-only">Additional context for screen readers</span>
```

#### Skip Link

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

### Heading Hierarchy

```html
<h1>Page Title</h1>
<h2>Major Section</h2>
<h3>Subsection</h3>
<h2>Another Major Section</h2>
<h3>Subsection</h3>
```

## For Testers

### Keyboard Testing Checklist

- [ ] Tab through entire page
- [ ] Skip link appears on first Tab
- [ ] All interactive elements reachable
- [ ] Focus indicators visible
- [ ] Logical tab order
- [ ] Enter/Space activates buttons
- [ ] Arrow keys work in lists/radios
- [ ] Escape closes modals
- [ ] No keyboard traps

### Screen Reader Testing

#### NVDA (Windows)

1. Download from nvaccess.org
2. Start NVDA (Ctrl+Alt+N)
3. Navigate with arrow keys
4. Tab through interactive elements
5. Listen for announcements

#### VoiceOver (Mac)

1. Enable: System Preferences → Accessibility → VoiceOver
2. Start VoiceOver (Cmd+F5)
3. Navigate with VO+arrow keys
4. Tab through interactive elements
5. Listen for announcements

### Visual Testing

- [ ] Focus indicators visible on all elements
- [ ] Text readable at 200% zoom
- [ ] Color contrast sufficient (4.5:1)
- [ ] No information conveyed by color alone
- [ ] Responsive on mobile devices

### Automated Testing Tools

1. **Lighthouse** (Chrome DevTools)
   - Open DevTools (F12)
   - Go to Lighthouse tab
   - Run accessibility audit

2. **axe DevTools** (Browser Extension)
   - Install from browser store
   - Click extension icon
   - Run scan

3. **WAVE** (Browser Extension)
   - Install from browser store
   - Click extension icon
   - Review issues

## Common Issues and Solutions

### Issue: Element not keyboard accessible

**Solution:** Add `tabindex="0"` and keyboard event handlers

### Issue: Screen reader not announcing changes

**Solution:** Use `accessibilityHelper.announce()` or add `aria-live` region

### Issue: Focus not visible

**Solution:** Check `:focus-visible` styles are applied

### Issue: Heading hierarchy broken

**Solution:** Ensure h1 → h2 → h3 order without skipping

### Issue: Form not accessible

**Solution:** Add labels, fieldsets, and ARIA attributes

### Issue: Images not described

**Solution:** Add alt text or `aria-label`

## Browser Support

| Browser | Version | Support |
| ------- | ------- | ------- |
| Chrome  | 90+     | ✅ Full |
| Firefox | 88+     | ✅ Full |
| Safari  | 14+     | ✅ Full |
| Edge    | 90+     | ✅ Full |

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Need Help?

Refer to:

1. `ACCESSIBILITY_FEATURES.md` - Complete feature documentation
2. `ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md` - Implementation details
3. `src/utils/AccessibilityHelper.js` - Utility source code
