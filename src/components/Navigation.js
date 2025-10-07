/**
 * Navigation - Header navigation component with theme toggle and specialization support
 */
class Navigation {
  constructor(
    themeManager,
    router,
    specializationService = null,
    specializationSelector = null
  ) {
    this.themeManager = themeManager;
    this.router = router;
    this.specializationService = specializationService;
    this.specializationSelector = specializationSelector;
    this.element = null;
    this.mobileMenuOpen = false;
  }

  /**
   * Render specialization indicator
   */
  _renderSpecializationIndicator() {
    if (!this.specializationService) {
      return '';
    }

    const currentSpecialization =
      this.specializationService.getCurrentSpecialization();
    const hasSelected = this.specializationService.hasSelectedSpecialization();

    if (!hasSelected || !currentSpecialization) {
      return `
        <button class="specialization-selector no-selection" aria-label="Select your specialization" title="Select your specialization">
          <span class="specialization-icon" aria-hidden="true">⚙️</span>
          <span class="specialization-text">Select Specialization</span>
        </button>
      `;
    }

    const config = this.specializationService.getSpecializationConfig(
      currentSpecialization
    );
    if (!config) {
      return '';
    }

    return `
      <div class="specialization-indicator">
        <button class="specialization-selector" aria-label="Change specialization: ${config.name}" title="Change specialization">
          <span class="specialization-icon" aria-hidden="true">${config.icon}</span>
          <span class="specialization-text">${config.shortName}</span>
          <span class="specialization-dropdown-icon" aria-hidden="true">▼</span>
        </button>
      </div>
    `;
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
            ${this._renderSpecializationIndicator()}
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

    // Specialization selector
    const specializationSelector = this.element.querySelector(
      '.specialization-selector'
    );
    if (specializationSelector) {
      specializationSelector.addEventListener('click', () =>
        this._handleSpecializationSelector()
      );
    }

    // Mobile menu toggle
    const navToggle = this.element.querySelector('.nav-toggle');
    navToggle.addEventListener('click', () => this._toggleMobileMenu());

    // Close mobile menu when clicking any navigation link
    const navLinks = this.element.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        // Only handle mobile menu closure if menu is open
        if (this.mobileMenuOpen) {
          // Prevent default navigation temporarily
          e.preventDefault();

          // Force immediate menu close
          const navMenu = this.element.querySelector('.nav-menu');
          const navToggle = this.element.querySelector('.nav-toggle');

          if (navMenu) navMenu.classList.remove('active');
          if (navToggle) {
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
          }

          this.mobileMenuOpen = false;
          document.body.style.overflow = '';

          // Navigate after a small delay to ensure menu is closed
          setTimeout(() => {
            window.location.href = link.href;
          }, 100);
        }
      });
    });

    // Also close menu when clicking the logo/brand link
    const navLogo = this.element.querySelector('.nav-logo');
    if (navLogo) {
      navLogo.addEventListener('click', () => {
        this._closeMobileMenu();
      });
    }

    // Additional safety: close menu on any link click within nav-menu
    const navMenu = this.element.querySelector('.nav-menu');
    if (navMenu) {
      navMenu.addEventListener('click', e => {
        // Check if clicked element is a link (a tag)
        const clickedLink =
          e.target.tagName === 'A' ? e.target : e.target.closest('a');
        if (clickedLink && this.mobileMenuOpen) {
          // Prevent default navigation temporarily
          e.preventDefault();

          // Force immediate menu close
          navMenu.classList.remove('active');
          const navToggle = this.element.querySelector('.nav-toggle');
          if (navToggle) {
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
          }
          this.mobileMenuOpen = false;
          document.body.style.overflow = '';

          // Navigate after ensuring menu is closed
          setTimeout(() => {
            window.location.href = clickedLink.href;
          }, 100);
        }
      });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', e => {
      if (this.mobileMenuOpen && !this.element.contains(e.target)) {
        this._closeMobileMenu();
      }
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.mobileMenuOpen) {
        this._closeMobileMenu();
      }
    });

    // Handle window resize - close menu if switching to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this.mobileMenuOpen) {
        this._closeMobileMenu();
      }
    });

    // Listen for route changes to update active link and close mobile menu
    window.addEventListener('hashchange', () => {
      this._updateActiveLink();
      // Always close mobile menu when route changes
      this._closeMobileMenu();
    });

    // Emergency fix: Force close menu on any navigation
    document.addEventListener('click', e => {
      const clickedLink =
        e.target.tagName === 'A' ? e.target : e.target.closest('a');
      if (
        clickedLink &&
        clickedLink.href &&
        clickedLink.href.includes('#') &&
        this.mobileMenuOpen
      ) {
        // Force immediate visual closure
        const navMenu = this.element.querySelector('.nav-menu');
        const navToggle = this.element.querySelector('.nav-toggle');

        if (navMenu) {
          navMenu.classList.remove('active');
          navMenu.style.transform = 'translateX(-100%)';
          navMenu.style.visibility = 'hidden';
        }
        if (navToggle) {
          navToggle.classList.remove('active');
          navToggle.setAttribute('aria-expanded', 'false');
        }

        this.mobileMenuOpen = false;
        document.body.style.overflow = '';
      }
    });

    // Listen for theme changes
    window.addEventListener('themechange', e => {
      const themeIcon = e.detail.theme === 'dark' ? '☀️' : '🌙';
      const themeIconEl = this.element.querySelector('.theme-icon');
      if (themeIconEl) {
        themeIconEl.textContent = themeIcon;
      }
    });

    // Listen for specialization changes
    window.addEventListener('specialization-changed', () => {
      this._updateSpecializationIndicator();
    });
  }

  /**
   * Handle specialization selector click
   */
  _handleSpecializationSelector() {
    if (!this.specializationSelector) {
      console.warn('SpecializationSelector not available');
      return;
    }

    const hasSelected = this.specializationService?.hasSelectedSpecialization();

    if (hasSelected) {
      // If user has already selected a specialization, show the modal to change it
      this.specializationSelector.showSpecializationModal(false);
    } else {
      // If no specialization selected, show the selection modal
      this.specializationSelector.showSpecializationModal(false);
    }
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

      // Focus management for accessibility
      const firstLink = navMenu.querySelector('.nav-link');
      if (firstLink) {
        setTimeout(() => firstLink.focus(), 100);
      }
    } else {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  /**
   * Close mobile menu
   */
  _closeMobileMenu() {
    if (this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
      const navMenu = this.element.querySelector('.nav-menu');
      const navToggle = this.element.querySelector('.nav-toggle');

      // Remove active classes immediately
      if (navMenu) navMenu.classList.remove('active');
      if (navToggle) {
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
      document.body.style.overflow = '';
    }
  }

  /**
   * Update specialization indicator
   */
  _updateSpecializationIndicator() {
    if (!this.specializationService) {
      return;
    }

    const navActions = this.element.querySelector('.nav-actions');
    if (!navActions) {
      return;
    }

    // Find and replace the specialization indicator
    const existingIndicator = navActions.querySelector(
      '.specialization-indicator, .specialization-selector'
    );
    if (existingIndicator) {
      const newIndicatorHTML = this._renderSpecializationIndicator();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newIndicatorHTML;
      const newIndicator = tempDiv.firstElementChild;

      if (newIndicator) {
        existingIndicator.replaceWith(newIndicator);

        // Re-attach event listener
        const specializationSelector = navActions.querySelector(
          '.specialization-selector'
        );
        if (specializationSelector) {
          specializationSelector.addEventListener('click', () =>
            this._handleSpecializationSelector()
          );
        }
      }
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
   * Update specialization display
   */
  updateSpecialization(specializationId) {
    this._updateSpecializationIndicator();
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
