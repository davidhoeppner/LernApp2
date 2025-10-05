import StorageService from './StorageService.js';

/**
 * ThemeManager - Handles theme switching and persistence
 */
class ThemeManager {
  constructor() {
    this.storage = new StorageService();
    this.currentTheme = 'light';
    this.STORAGE_KEY = 'theme';
    this.THEME_ATTRIBUTE = 'data-theme';
  }

  /**
   * Initialize theme manager
   */
  init() {
    // Try to load saved theme
    const savedTheme = this.storage.get(this.STORAGE_KEY);

    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.currentTheme = savedTheme;
    } else {
      // Detect system preference
      this.currentTheme = this._detectSystemPreference();
    }

    this.applyTheme();
  }

  /**
   * Detect system theme preference
   */
  _detectSystemPreference() {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Get current theme
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Set theme
   */
  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.error(`Invalid theme: ${theme}. Must be 'light' or 'dark'.`);
      return false;
    }

    this.currentTheme = theme;
    this.applyTheme();
    this._saveTheme();

    return true;
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    return this.setTheme(newTheme);
  }

  /**
   * Apply theme to document
   */
  applyTheme() {
    // Set data attribute on document root
    document.documentElement.setAttribute(
      this.THEME_ATTRIBUTE,
      this.currentTheme
    );

    // Also set class for backwards compatibility
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${this.currentTheme}-theme`);

    // Dispatch custom event for components that need to react
    window.dispatchEvent(
      new CustomEvent('themechange', {
        detail: { theme: this.currentTheme },
      })
    );
  }

  /**
   * Save theme preference to storage
   */
  _saveTheme() {
    try {
      this.storage.set(this.STORAGE_KEY, this.currentTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }

  /**
   * Listen for system theme changes
   */
  watchSystemPreference() {
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

      darkModeQuery.addEventListener('change', e => {
        // Only auto-switch if user hasn't manually set a preference
        const savedTheme = this.storage.get(this.STORAGE_KEY);
        if (!savedTheme) {
          const newTheme = e.matches ? 'dark' : 'light';
          this.setTheme(newTheme);
        }
      });
    }
  }
}

export default ThemeManager;
