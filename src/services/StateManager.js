import StorageService from './StorageService.js';

/**
 * StateManager - Centralized application state management
 */
class StateManager {
  constructor() {
    this.state = {
      modules: [],
      quizzes: [],
      progress: {
        modulesCompleted: [],
        modulesInProgress: [],
        quizAttempts: [],
        lastActivity: null,
      },
      currentUser: null,
    };
    this.listeners = new Map();
    this.storage = new StorageService();
  }

  /**
   * Get state value by key
   */
  getState(key) {
    if (key === undefined) {
      return this.state;
    }

    // Support nested keys like 'progress.modulesCompleted'
    const keys = key.split('.');
    let value = this.state;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Set state value by key with validation
   */
  setState(key, value) {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid key: key must be a non-empty string');
    }

    // Support nested keys
    const keys = key.split('.');
    let target = this.state;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target)) {
        target[k] = {};
      }
      target = target[k];
    }

    const lastKey = keys[keys.length - 1];
    const oldValue = target[lastKey];
    target[lastKey] = value;

    // Notify listeners
    this._notifyListeners(key, value, oldValue);

    // Auto-save to storage
    this.saveToStorage();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => this.unsubscribe(key, callback);
  }

  /**
   * Unsubscribe from state changes
   */
  unsubscribe(key, callback) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).delete(callback);

      // Clean up empty listener sets
      if (this.listeners.get(key).size === 0) {
        this.listeners.delete(key);
      }
    }
  }

  /**
   * Notify all listeners for a key
   */
  _notifyListeners(key, newValue, oldValue) {
    // Notify exact key listeners
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`Error in state listener for "${key}":`, error);
        }
      });
    }

    // Notify wildcard listeners (*)
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(callback => {
        try {
          callback(key, newValue, oldValue);
        } catch (error) {
          console.error('Error in wildcard state listener:', error);
        }
      });
    }
  }

  /**
   * Load state from localStorage
   */
  loadFromStorage() {
    try {
      const savedState = this.storage.get('appState');

      if (savedState && typeof savedState === 'object') {
        // Merge saved state with default state
        this.state = {
          ...this.state,
          ...savedState,
          progress: {
            ...this.state.progress,
            ...(savedState.progress || {}),
          },
        };

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error loading state from storage:', error);
      return false;
    }
  }

  /**
   * Save state to localStorage
   */
  saveToStorage() {
    try {
      this.storage.set('appState', this.state);
      return true;
    } catch (error) {
      console.error('Error saving state to storage:', error);

      // If quota exceeded, try to save minimal state
      if (
        error.name === 'QuotaExceededError' ||
        error.message.includes('quota')
      ) {
        try {
          const minimalState = {
            progress: this.state.progress,
          };
          this.storage.set('appState', minimalState);
          console.warn('Saved minimal state due to storage quota');

          // Notify user via custom event
          window.dispatchEvent(
            new CustomEvent('storage-quota-warning', {
              detail: { error, minimalStateSaved: true },
            })
          );
        } catch (e) {
          console.error('Failed to save even minimal state:', e);

          // Notify user via custom event
          window.dispatchEvent(
            new CustomEvent('storage-quota-error', {
              detail: { error: e },
            })
          );
        }
      }

      return false;
    }
  }

  /**
   * Reset state to defaults
   */
  reset() {
    this.state = {
      modules: [],
      quizzes: [],
      progress: {
        modulesCompleted: [],
        modulesInProgress: [],
        quizAttempts: [],
        lastActivity: null,
      },
      currentUser: null,
    };

    this.storage.clear();
    this._notifyListeners('*', this.state, null);
  }
}

export default StateManager;
