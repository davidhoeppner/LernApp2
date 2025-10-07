import accessibilityHelper from '../utils/AccessibilityHelper.js';

/**
 * Router - Hash-based routing for single-page application
 * Enhanced with specialization context support while maintaining backward compatibility
 */
class Router {
  constructor(appContainer) {
    this.routes = new Map();
    this.appContainer = appContainer;
    this.currentView = null;
    this.currentRoute = null;
    this.notFoundHandler = null;
    this.specializationService = null; // Will be set by app initialization
  }

  /**
   * Set specialization service for context-aware routing
   * @param {SpecializationService} specializationService - The specialization service
   */
  setSpecializationService(specializationService) {
    this.specializationService = specializationService;
  }

  /**
   * Register a route with its view factory
   */
  register(path, viewFactory) {
    if (typeof path !== 'string' || !path) {
      throw new Error('Route path must be a non-empty string');
    }

    if (typeof viewFactory !== 'function') {
      throw new Error('View factory must be a function');
    }

    this.routes.set(path, viewFactory);
  }

  /**
   * Register a 404 not found handler
   */
  registerNotFound(viewFactory) {
    this.notFoundHandler = viewFactory;
  }

  /**
   * Initialize router and start listening to hash changes
   */
  init() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => this._handleRouteChange());

    // Handle initial route
    this._handleRouteChange();
  }

  /**
   * Navigate to a route programmatically
   * @param {string} path - The route path
   * @param {Object} params - Query parameters
   * @param {Object} options - Navigation options
   * @param {boolean} options.preserveSpecialization - Whether to preserve specialization context
   */
  navigate(path, params = {}, options = {}) {
    if (!path) {
      path = '/';
    }

    const { preserveSpecialization = true } = options;

    // Add specialization context if available and requested
    if (preserveSpecialization && this.specializationService) {
      const currentSpecialization = this.specializationService.getCurrentSpecialization();
      if (currentSpecialization && !params.specialization) {
        params.specialization = currentSpecialization;
      }
    }

    // Build hash with parameters
    let hash = `#${path}`;

    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      hash += `?${queryString}`;
    }

    window.location.hash = hash;
  }

  /**
   * Handle route changes
   */
  _handleRouteChange() {
    const { path, params } = this._parseHash();

    // Find matching route
    const route = this._matchRoute(path);

    if (route) {
      this._renderView(route, path, params);
    } else {
      this._handle404(path);
    }
  }

  /**
   * Parse current hash into path and params
   * Enhanced to handle specialization context while maintaining backward compatibility
   */
  _parseHash() {
    const hash = window.location.hash.slice(1) || '/';

    // Split path and query string
    const [path, queryString] = hash.split('?');

    // Parse query parameters
    const params = {};
    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      for (const [key, value] of searchParams) {
        params[key] = value;
      }
    }

    // Parse path parameters (e.g., /module/:id)
    const pathParams = this._extractPathParams(path);

    // Handle specialization context from URL
    this._handleSpecializationContext(params);

    return {
      path: path || '/',
      params: { ...params, ...pathParams },
    };
  }

  /**
   * Handle specialization context from URL parameters
   * Provides fallback for legacy URLs without breaking existing functionality
   * @private
   * @param {Object} params - URL parameters
   */
  _handleSpecializationContext(params) {
    if (!this.specializationService) {
      return;
    }

    // If URL contains specialization parameter, validate and apply it
    if (params.specialization) {
      const availableSpecializations = this.specializationService.getAvailableSpecializations();
      const isValidSpecialization = availableSpecializations.some(
        spec => spec.id === params.specialization
      );

      if (isValidSpecialization) {
        const currentSpecialization = this.specializationService.getCurrentSpecialization();
        
        // Only update if different from current specialization
        if (currentSpecialization !== params.specialization) {
          console.log(`🔄 Switching specialization from URL: ${params.specialization}`);
          this.specializationService.setSpecialization(params.specialization, {
            preserveProgress: true
          });
        }
      } else {
        // Invalid specialization in URL - remove it but don't break navigation
        console.warn(`⚠️ Invalid specialization in URL: ${params.specialization}`);
        delete params.specialization;
        
        // Optionally redirect to clean URL (without invalid specialization)
        this._cleanupInvalidSpecializationUrl();
      }
    } else {
      // No specialization in URL - this is fine for backward compatibility
      // Legacy URLs will continue to work with user's current specialization
    }
  }

  /**
   * Clean up URL with invalid specialization parameter
   * @private
   */
  _cleanupInvalidSpecializationUrl() {
    try {
      const currentHash = window.location.hash;
      const [path, queryString] = currentHash.slice(1).split('?');
      
      if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        searchParams.delete('specialization');
        
        const cleanQueryString = searchParams.toString();
        const cleanHash = cleanQueryString ? `#${path}?${cleanQueryString}` : `#${path}`;
        
        // Replace current URL without triggering navigation
        window.history.replaceState(null, '', cleanHash);
      }
    } catch (error) {
      console.error('Error cleaning up invalid specialization URL:', error);
    }
  }

  /**
   * Extract parameters from path (e.g., /module/123 -> { id: '123' })
   */
  _extractPathParams(path) {
    const params = {};

    // Check each registered route for parameter patterns
    for (const [routePath] of this.routes) {
      const pattern = this._routeToRegex(routePath);
      const match = path.match(pattern);

      if (match) {
        // Extract parameter names from route path
        const paramNames = this._getParamNames(routePath);

        // Map matched values to parameter names
        paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        break;
      }
    }

    return params;
  }

  /**
   * Convert route path to regex pattern
   */
  _routeToRegex(routePath) {
    // Convert /module/:id to /module/([^/]+)
    const pattern = routePath
      .replace(/:[^/]+/g, '([^/]+)')
      .replace(/\//g, '\\/');

    return new RegExp(`^${pattern}$`);
  }

  /**
   * Get parameter names from route path
   */
  _getParamNames(routePath) {
    const matches = routePath.match(/:([^/]+)/g);
    if (!matches) return [];

    return matches.map(match => match.slice(1));
  }

  /**
   * Match current path to a registered route
   */
  _matchRoute(path) {
    // Try exact match first
    if (this.routes.has(path)) {
      return { path, viewFactory: this.routes.get(path) };
    }

    // Try pattern matching for parameterized routes
    for (const [routePath, viewFactory] of this.routes) {
      if (routePath.includes(':')) {
        const pattern = this._routeToRegex(routePath);
        if (pattern.test(path)) {
          return { path: routePath, viewFactory };
        }
      }
    }

    return null;
  }

  /**
   * Render a view
   */
  async _renderView(route, path, params) {
    try {
      // Clean up previous view if it has a cleanup method
      if (this.currentView && typeof this.currentView.cleanup === 'function') {
        this.currentView.cleanup();
      }

      // Show loading state
      this.appContainer.innerHTML =
        '<div class="loading" role="status" aria-live="polite">Loading...</div>';

      // Create and render new view
      const viewResult = route.viewFactory(params);

      // Handle async views (promises)
      const view =
        viewResult instanceof Promise ? await viewResult : viewResult;

      // Clear container and trigger fade-in animation
      this.appContainer.innerHTML = '';
      this.appContainer.style.animation = 'none';

      // Force reflow to restart animation
      void this.appContainer.offsetWidth;
      this.appContainer.style.animation = '';

      // Render view
      if (typeof view === 'string') {
        this.appContainer.innerHTML = view;
      } else if (view instanceof HTMLElement) {
        this.appContainer.appendChild(view);
      } else if (view && typeof view.render === 'function') {
        const rendered = view.render();
        const resolvedRender =
          rendered instanceof Promise ? await rendered : rendered;

        if (typeof resolvedRender === 'string') {
          this.appContainer.innerHTML = resolvedRender;
        } else if (resolvedRender instanceof HTMLElement) {
          this.appContainer.appendChild(resolvedRender);
        }
      }

      // Store current view and route
      this.currentView = view;
      this.currentRoute = { path, params };

      // Scroll to top with smooth behavior (respects reduced motion)
      const scrollBehavior = accessibilityHelper.prefersReducedMotion()
        ? 'auto'
        : 'smooth';
      window.scrollTo({ top: 0, behavior: scrollBehavior });

      // Update active navigation
      this._updateActiveNav(path);

      // Set focus to main content for keyboard users
      setTimeout(() => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          accessibilityHelper.setFocus(mainContent);
        }
      }, 100);

      // Announce page change to screen readers
      const pageName = this._getPageName(path);
      accessibilityHelper.announce(`Navigated to ${pageName}`);
    } catch (error) {
      console.error('Error rendering view:', error);
      this._renderError(error);
    }
  }

  /**
   * Handle 404 not found
   */
  async _handle404(path) {
    console.warn(`Route not found: ${path}`);

    if (this.notFoundHandler) {
      try {
        const viewResult = this.notFoundHandler({ path });
        const view =
          viewResult instanceof Promise ? await viewResult : viewResult;

        this.appContainer.innerHTML = '';
        this.appContainer.style.animation = 'none';
        void this.appContainer.offsetWidth;
        this.appContainer.style.animation = '';

        if (typeof view === 'string') {
          this.appContainer.innerHTML = view;
        } else if (view instanceof HTMLElement) {
          this.appContainer.appendChild(view);
        }

        // Scroll to top
        const scrollBehavior = accessibilityHelper.prefersReducedMotion()
          ? 'auto'
          : 'smooth';
        window.scrollTo({ top: 0, behavior: scrollBehavior });

        // Announce to screen readers
        accessibilityHelper.announce('Page not found');
      } catch (error) {
        console.error('Error rendering 404 view:', error);
        // Fallback to home on error
        this.navigate('/');
      }
    } else {
      // Default 404 - redirect to home
      this.navigate('/');
    }
  }

  /**
   * Render error view
   */
  _renderError(error) {
    this.appContainer.innerHTML = `
      <div class="error-view">
        <h1>Oops! Something went wrong</h1>
        <p>${error.message}</p>
        <button onclick="window.location.hash = '#/'">Go Home</button>
      </div>
    `;
  }

  /**
   * Update active navigation links
   */
  _updateActiveNav(path) {
    // Remove active class from all nav links
    document.querySelectorAll('[data-nav-link]').forEach(link => {
      link.classList.remove('active');
    });

    // Add active class to matching link
    const activeLink = document.querySelector(`[data-nav-link="${path}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  /**
   * Get current route info
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Refresh the current route (useful after specialization changes)
   */
  refresh() {
    this._handleRouteChange();
  }

  /**
   * Generate URL with specialization context
   * @param {string} path - The route path
   * @param {Object} params - Additional parameters
   * @param {boolean} includeSpecialization - Whether to include current specialization
   * @returns {string} Complete URL hash
   */
  generateUrl(path, params = {}, includeSpecialization = true) {
    const urlParams = { ...params };

    // Add current specialization if requested and available
    if (includeSpecialization && this.specializationService) {
      const currentSpecialization = this.specializationService.getCurrentSpecialization();
      if (currentSpecialization && !urlParams.specialization) {
        urlParams.specialization = currentSpecialization;
      }
    }

    // Build URL
    let url = `#${path}`;
    if (Object.keys(urlParams).length > 0) {
      const queryString = new URLSearchParams(urlParams).toString();
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Check if current URL has specialization context
   * @returns {boolean} True if URL contains specialization parameter
   */
  hasSpecializationContext() {
    const { params } = this._parseHash();
    return !!params.specialization;
  }

  /**
   * Get specialization from current URL
   * @returns {string|null} Specialization ID from URL or null
   */
  getUrlSpecialization() {
    const { params } = this._parseHash();
    return params.specialization || null;
  }

  /**
   * Get human-readable page name from path
   */
  _getPageName(path) {
    const pageNames = {
      '/': 'Home',
      '/modules': 'Learning Modules',
      '/quizzes': 'Quizzes',
      '/progress': 'Progress',
    };

    // Check for exact match
    if (pageNames[path]) {
      return pageNames[path];
    }

    // Check for pattern matches
    if (path.startsWith('/module/')) {
      return 'Module Details';
    }
    if (path.startsWith('/quizzes/')) {
      return 'Quiz';
    }

    return 'Page';
  }
}

export default Router;
