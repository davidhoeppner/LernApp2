/**
 * Event handling utilities for consistent event management across components
 */

/**
 * Attach multiple event listeners with a single function call
 * @param {HTMLElement} container - Container element to search within
 * @param {Array} eventConfigs - Array of event configuration objects
 *
 * Example usage:
 * attachEventListeners(container, [
 *   { selector: '.btn-primary', event: 'click', handler: () => console.warn('clicked') },
 *   { selector: '.input', event: 'input', handler: (e) => console.warn(e.target.value) }
 * ]);
 */
export function attachEventListeners(container, eventConfigs) {
  eventConfigs.forEach(config => {
    const { selector, event, handler, options = {} } = config;

    if (selector && event && handler) {
      const elements = container.querySelectorAll(selector);
      elements.forEach(element => {
        element.addEventListener(event, handler, options);
      });
    }
  });
}

/**
 * Create a standardized filter button handler
 * @param {HTMLElement} container - Container with filter buttons
 * @param {Function} onFilterChange - Callback when filter changes
 * @param {string} activeClass - CSS class for active filter (default: 'active')
 */
export function attachFilterListeners(
  container,
  onFilterChange,
  activeClass = 'active'
) {
  const filterButtons = container.querySelectorAll('.filter-btn');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      // Update active state
      filterButtons.forEach(b => b.classList.remove(activeClass));
      btn.classList.add(activeClass);

      // Get filter value
      const filter = btn.dataset.filter || btn.textContent.toLowerCase();

      // Call handler
      if (onFilterChange) {
        onFilterChange(filter, btn, e);
      }
    });
  });
}

/**
 * Create standardized navigation button handlers
 * @param {HTMLElement} container - Container with navigation buttons
 * @param {Object} router - Router instance for navigation
 * @param {Object} routes - Map of button selectors to routes
 *
 * Example:
 * attachNavigationListeners(container, router, {
 *   '[data-action="back"]': '/modules',
 *   '[data-action="home"]': '/',
 *   '.module-card': (element) => `/modules/${element.dataset.moduleId}`
 * });
 */
export function attachNavigationListeners(container, router, routes) {
  Object.entries(routes).forEach(([selector, route]) => {
    const elements = container.querySelectorAll(selector);

    elements.forEach(element => {
      element.addEventListener('click', e => {
        e.preventDefault();

        // Determine route
        let targetRoute;
        if (typeof route === 'function') {
          targetRoute = route(element, e);
        } else {
          targetRoute = route;
        }

        // Navigate
        if (router && targetRoute) {
          router.navigate(targetRoute);
        } else if (targetRoute) {
          window.location.hash = `#${targetRoute}`;
        }
      });
    });
  });
}

/**
 * Create standardized action button handlers with loading states
 * @param {HTMLElement} container - Container with action buttons
 * @param {Object} actions - Map of button selectors to action functions
 *
 * Example:
 * attachActionListeners(container, {
 *   '[data-action="complete"]': async (btn, e) => {
 *     await completeModule();
 *     btn.textContent = 'Completed!';
 *   },
 *   '[data-action="export"]': exportData
 * });
 */
export function attachActionListeners(container, actions) {
  Object.entries(actions).forEach(([selector, actionFn]) => {
    const elements = container.querySelectorAll(selector);

    elements.forEach(element => {
      element.addEventListener('click', async e => {
        e.preventDefault();

        if (!actionFn) return;

        // Store original state
        const originalText = element.textContent;
        const originalDisabled = element.disabled;

        try {
          // Set loading state
          element.disabled = true;

          // Execute action
          await actionFn(element, e);
        } catch (error) {
          console.error('Action failed:', error);

          // Show error state briefly
          element.textContent = 'Error';
          element.classList.add('btn-error');

          setTimeout(() => {
            element.textContent = originalText;
            element.classList.remove('btn-error');
          }, 2000);
        } finally {
          // Restore original state
          element.disabled = originalDisabled;
        }
      });
    });
  });
}

/**
 * Create a delegated event listener for dynamic content
 * @param {HTMLElement} container - Container element
 * @param {string} selector - CSS selector for target elements
 * @param {string} event - Event type
 * @param {Function} handler - Event handler function
 */
export function attachDelegatedListener(container, selector, event, handler) {
  container.addEventListener(event, e => {
    const target = e.target.closest(selector);
    if (target) {
      handler(e, target);
    }
  });
}

/**
 * Create standardized tab switching functionality
 * @param {HTMLElement} container - Container with tabs
 * @param {Function} onTabChange - Callback when tab changes
 * @param {string} tabSelector - CSS selector for tab buttons (default: '.tab-btn')
 * @param {string} activeClass - CSS class for active tab (default: 'active')
 */
export function attachTabListeners(
  container,
  onTabChange,
  tabSelector = '.tab-btn',
  activeClass = 'active'
) {
  const tabs = container.querySelectorAll(tabSelector);

  tabs.forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();

      // Update active state
      tabs.forEach(t => t.classList.remove(activeClass));
      tab.classList.add(activeClass);

      // Get tab identifier
      const tabId = tab.dataset.tab || tab.textContent.toLowerCase();

      // Call handler
      if (onTabChange) {
        onTabChange(tabId, tab, e);
      }
    });
  });
}

/**
 * Debounce function for search inputs and other frequent events
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };

    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(this, args);
  };
}

/**
 * Create standardized search input handler with debouncing
 * @param {HTMLElement} searchInput - Search input element
 * @param {Function} onSearch - Search handler function
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 300)
 */
export function attachSearchListener(searchInput, onSearch, debounceMs = 300) {
  const debouncedSearch = debounce(query => {
    if (onSearch) {
      onSearch(query.trim());
    }
  }, debounceMs);

  searchInput.addEventListener('input', e => {
    debouncedSearch(e.target.value);
  });

  // Handle enter key
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSearch) {
        onSearch(e.target.value.trim());
      }
    }
  });
}
