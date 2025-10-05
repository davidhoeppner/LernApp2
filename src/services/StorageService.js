/**
 * StorageService - Handles localStorage operations with error handling
 */
class StorageService {
  constructor(prefix = 'learning-app') {
    this.prefix = prefix;
    this.isAvailable = this._checkAvailability();
    this.fallbackStorage = new Map(); // In-memory fallback
  }

  /**
   * Check if localStorage is available
   */
  _checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      console.warn('localStorage is not available, using in-memory storage');
      return false;
    }
  }

  /**
   * Get a prefixed key
   */
  _getKey(key) {
    return `${this.prefix}:${key}`;
  }

  /**
   * Get value from localStorage
   */
  get(key) {
    try {
      if (!this.isAvailable) {
        return this.fallbackStorage.get(this._getKey(key)) || null;
      }

      const item = localStorage.getItem(this._getKey(key));
      if (item === null) {
        return null;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error getting item "${key}" from storage:`, error);
      // Try fallback storage
      return this.fallbackStorage.get(this._getKey(key)) || null;
    }
  }

  /**
   * Set value in localStorage with automatic fallback to in-memory storage
   * Throws QuotaExceededError if localStorage is full
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be JSON serialized)
   * @returns {boolean} True if successful
   * @throws {Error} QuotaExceededError if storage quota exceeded
   */
  set(key, value) {
    const prefixedKey = this._getKey(key);

    try {
      if (!this.isAvailable) {
        this.fallbackStorage.set(prefixedKey, value);
        return true;
      }

      const serialized = JSON.stringify(value);
      localStorage.setItem(prefixedKey, serialized);

      // Also update fallback storage
      this.fallbackStorage.set(prefixedKey, value);

      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Unable to save data.');

        // Try to save to fallback storage
        this.fallbackStorage.set(prefixedKey, value);

        const quotaError = new Error(
          'Storage quota exceeded. Please export your progress or clear some data.'
        );
        quotaError.name = 'QuotaExceededError';
        throw quotaError;
      }
      console.error(`Error setting item "${key}" in storage:`, error);

      // Try fallback storage
      this.fallbackStorage.set(prefixedKey, value);
      throw error;
    }
  }

  /**
   * Remove item from localStorage
   */
  remove(key) {
    const prefixedKey = this._getKey(key);

    try {
      if (this.isAvailable) {
        localStorage.removeItem(prefixedKey);
      }
      this.fallbackStorage.delete(prefixedKey);
      return true;
    } catch (error) {
      console.error(`Error removing item "${key}" from storage:`, error);
      this.fallbackStorage.delete(prefixedKey);
      return false;
    }
  }

  /**
   * Clear all items with the prefix
   */
  clear() {
    try {
      if (this.isAvailable) {
        const keys = Object.keys(localStorage);
        const prefixedKeys = keys.filter(key =>
          key.startsWith(`${this.prefix}:`)
        );
        prefixedKeys.forEach(key => localStorage.removeItem(key));
      }

      // Clear fallback storage
      const fallbackKeys = Array.from(this.fallbackStorage.keys());
      fallbackKeys.forEach(key => {
        if (key.startsWith(`${this.prefix}:`)) {
          this.fallbackStorage.delete(key);
        }
      });

      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Check if key exists in localStorage
   */
  has(key) {
    const prefixedKey = this._getKey(key);

    if (this.isAvailable) {
      return localStorage.getItem(prefixedKey) !== null;
    }

    return this.fallbackStorage.has(prefixedKey);
  }

  /**
   * Get storage usage information
   * Calculates used space and percentage based on estimated 5MB limit
   * @returns {Object} Storage info with available, used, total, and percentage
   */
  getStorageInfo() {
    if (!this.isAvailable) {
      return {
        available: false,
        used: 0,
        total: 0,
        percentage: 0,
      };
    }

    try {
      let used = 0;
      for (let key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Most browsers have 5-10MB limit, we'll estimate 5MB
      const total = 5 * 1024 * 1024;
      const percentage = (used / total) * 100;

      return {
        available: true,
        used,
        total,
        percentage: Math.round(percentage),
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        available: true,
        used: 0,
        total: 0,
        percentage: 0,
      };
    }
  }
}

export default StorageService;
