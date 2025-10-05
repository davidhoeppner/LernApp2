/**
 * Navigation - Header navigation component with theme toggle
 */
class Navigation {
  constructor(themeManager, router) {
    this.themeManager = themeManager;
    this.router = router;
    this.element = null;
    this.mobileMenuOpen = false;
  }

  /**
   * Render navigation component
   */
  render() {
    const currentTheme = this.themeManager.getTheme();
    const themeIcon = currentTheme === 'dark' ? '☀️' : '🌙';
    const themeLabel =
      currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

    this.element = document.createElement('nav');
    this.element.className = 'navigation';
    this.element.setAttribute('role', 'navigation');
    this.element.setAttribute('aria-label', 'Main navigation');
    this.element.innerHTML = `
      <div class="nav-container">
        <div class="nav-brand">
          <a href="#/" class="nav-logo" aria-label="LearnApp home">
            <span class="logo-icon" aria-hidden="true">📚</span>
            <span class="logo-text">LearnApp</span>
          </a>
        </div>

        <button class="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="nav-menu">
          <span class="hamburger"></span>
          <span class="sr-only">Menu</span>
        </button>

        <div class="nav-menu" id="nav-menu">
          <ul class="nav-links" role="list">
            <li><a href="#/" data-nav-link="/" class="nav-link" aria-label="Go to home page">Home</a></li>
            <li><a href="#/modules" data-nav-link="/modules" class="nav-link" aria-label="Browse all learning modules including IHK content">Modules</a></li>
            <li><a href="#/quizzes" data-nav-link="/quizzes" class="nav-link" aria-label="View all available quizzes including IHK quizzes">Quizzes</a></li>
            <li><a href="#/wheel" data-nav-link="/wheel" class="nav-link" aria-label="Spin the wheel to discover a random learning module">🎯 Lern-Modul</a></li>
            <li><a href="#/progress" data-nav-link="/progress" class="nav-link" aria-label="View your progress">Progress</a></li>
          </ul>

          <div class="nav-actions">
            <button class="theme-toggle" aria-label="${themeLabel}" title="${themeLabel}">
              <span class="theme-icon" aria-hidden="true">${themeIcon}</span>
              <span class="sr-only">${themeLabel}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this._attachEventListeners();
    this._updateActiveLink();

    return this.element;
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    // Theme toggle
    const themeToggle = this.element.querySelector('.theme-toggle');
    themeToggle.addEventListener('click', () => this._handleThemeToggle());

    // Mobile menu toggle
    const navToggle = this.element.querySelector('.nav-toggle');
    navToggle.addEventListener('click', () => this._toggleMobileMenu());

    // Close mobile menu when clicking a link
    const navLinks = this.element.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (this.mobileMenuOpen) {
          this._toggleMobileMenu();
        }
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', e => {
      if (this.mobileMenuOpen && !this.element.contains(e.target)) {
        this._toggleMobileMenu();
      }
    });

    // Listen for route changes to update active link
    window.addEventListener('hashchange', () => this._updateActiveLink());

    // Listen for theme changes
    window.addEventListener('themechange', e => {
      const themeIcon = e.detail.theme === 'dark' ? '☀️' : '🌙';
      const themeIconEl = this.element.querySelector('.theme-icon');
      if (themeIconEl) {
        themeIconEl.textContent = themeIcon;
      }
    });
  }

  /**
   * Handle theme toggle
   */
  _handleThemeToggle() {
    this.themeManager.toggleTheme();
    const newTheme = this.themeManager.getTheme();
    const themeLabel =
      newTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

    // Update aria-label for accessibility
    const themeToggle = this.element.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', themeLabel);
      themeToggle.setAttribute('title', themeLabel);

      const srText = themeToggle.querySelector('.sr-only');
      if (srText) {
        srText.textContent = themeLabel;
      }
    }
  }

  /**
   * Toggle mobile menu
   */
  _toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    const navMenu = this.element.querySelector('.nav-menu');
    const navToggle = this.element.querySelector('.nav-toggle');

    if (this.mobileMenuOpen) {
      navMenu.classList.add('active');
      navToggle.classList.add('active');
      navToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    } else {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  /**
   * Update active navigation link based on current route
   */
  _updateActiveLink() {
    const currentPath = window.location.hash.slice(1).split('?')[0] || '/';
    const navLinks = this.element.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      const linkPath = link.getAttribute('data-nav-link');

      // Exact match or starts with for nested routes
      if (
        linkPath === currentPath ||
        (linkPath !== '/' && currentPath.startsWith(linkPath))
      ) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Remove event listeners if needed
    if (this.mobileMenuOpen) {
      document.body.style.overflow = '';
    }
  }
}

export default Navigation;
