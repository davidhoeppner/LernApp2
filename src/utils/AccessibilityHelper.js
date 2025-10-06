/**
 * AccessibilityHelper - Utilities for accessibility features
 */
class AccessibilityHelper {
  constructor() {
    this.liveRegion = null;
    this.focusHistory = [];
  }

  /**
   * Initialize accessibility helper
   */
  init() {
    this.liveRegion = document.getElementById('live-region');
    if (!this.liveRegion) {
      this.liveRegion = this._createLiveRegion();
    }
  }

  /**
   * Create live region if it doesn't exist
   */
  _createLiveRegion() {
    const region = document.createElement('div');
    region.id = 'live-region';
    region.className = 'live-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
    return region;
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    if (!this.liveRegion) {
      this.init();
    }

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = '';

    // Small delay to ensure screen readers pick up the change
    setTimeout(() => {
      this.liveRegion.textContent = message;
    }, 100);

    // Clear after announcement
    setTimeout(() => {
      this.liveRegion.textContent = '';
    }, 3000);
  }

  /**
   * Set focus to element
   * @param {HTMLElement|string} element - Element or selector
   */
  setFocus(element) {
    const el =
      typeof element === 'string' ? document.querySelector(element) : element;

    if (el) {
      // Make element focusable if it isn't already
      if (!el.hasAttribute('tabindex') && !this._isFocusable(el)) {
        el.setAttribute('tabindex', '-1');
      }

      el.focus();
    }
  }

  /**
   * Check if element is naturally focusable
   */
  _isFocusable(element) {
    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    return (
      focusableTags.includes(element.tagName) ||
      element.hasAttribute('tabindex')
    );
  }

  /**
   * Save current focus for later restoration
   */
  saveFocus() {
    this.focusHistory.push(document.activeElement);
  }

  /**
   * Restore previously saved focus
   */
  restoreFocus() {
    const element = this.focusHistory.pop();
    if (element && element.focus) {
      element.focus();
    }
  }

  /**
   * Trap focus within a container (for modals, menus, etc.)
   * @param {HTMLElement} container - Container element
   */
  trapFocus(container) {
    const focusableElements = this._getFocusableElements(container);

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = e => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * Get all focusable elements within a container
   */
  _getFocusableElements(container) {
    const selector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    return Array.from(container.querySelectorAll(selector)).filter(
      el => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  }

  /**
   * Set up keyboard navigation for a list
   * @param {HTMLElement} container - Container element
   * @param {string} itemSelector - Selector for list items
   */
  setupListNavigation(container, itemSelector) {
    const items = Array.from(container.querySelectorAll(itemSelector));

    if (items.length === 0) return;

    items.forEach((item, index) => {
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');

      item.addEventListener('keydown', e => {
        let targetIndex = index;

        switch (e.key) {
          case 'ArrowDown':
          case 'ArrowRight':
            e.preventDefault();
            targetIndex = (index + 1) % items.length;
            break;

          case 'ArrowUp':
          case 'ArrowLeft':
            e.preventDefault();
            targetIndex = (index - 1 + items.length) % items.length;
            break;

          case 'Home':
            e.preventDefault();
            targetIndex = 0;
            break;

          case 'End':
            e.preventDefault();
            targetIndex = items.length - 1;
            break;

          default:
            return;
        }

        // Update tabindex
        items.forEach((el, i) => {
          el.setAttribute('tabindex', i === targetIndex ? '0' : '-1');
        });

        // Focus target
        items[targetIndex].focus();
      });
    });

    // Set role on container
    container.setAttribute('role', 'list');
  }

  /**
   * Add keyboard support for button-like elements
   * @param {HTMLElement} element - Element to enhance
   * @param {Function} callback - Click callback
   */
  makeKeyboardAccessible(element, callback) {
    if (!element.hasAttribute('role')) {
      element.setAttribute('role', 'button');
    }

    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }

    element.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        callback(e);
      }
    });
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get appropriate animation duration based on user preference
   */
  getAnimationDuration(defaultDuration = 300) {
    return this.prefersReducedMotion() ? 0 : defaultDuration;
  }
}

// Export singleton instance
const accessibilityHelper = new AccessibilityHelper();
export default accessibilityHelper;
