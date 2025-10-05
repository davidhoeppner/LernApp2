/* global setTimeout */
import accessibilityHelper from '../utils/AccessibilityHelper.js';

/**
 * Router - Hash-based routing for single-page application
 */
class Router {
  constructor(appContainer) {
    this.routes = new Map();
    this.appContainer = appContainer;
    this.currentView = null;
    this.currentRoute = null;
    this.notFoundHandler = null;
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
   */
  navigate(path, params = {}) {
    if (!path) {
      path = '/';
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

    return {
      path: path || '/',
      params: { ...params, ...pathParams },
    };
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
