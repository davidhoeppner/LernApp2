import { TIME, UI } from '../utils/constants.js';

/**
 * ToastNotification - System for displaying user feedback messages
 * Provides toast notifications for success, error, warning, and info messages
 */
class ToastNotification {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.nextId = 1;
    this.init();
  }

  /**
   * Initialize toast container
   */
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show a toast notification
   */
  show(options = {}) {
    const {
      type = 'info',
      message = '',
      duration = TIME.FIVE_SECONDS,
      dismissible = true,
      action = null,
    } = options;

    const id = this.nextId++;
    const toast = this._createToast(id, type, message, dismissible, action);

    this.toasts.set(id, toast);
    this.container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  /**
   * Show success toast
   */
  success(message, options = {}) {
    return this.show({
      type: 'success',
      message,
      ...options,
    });
  }

  /**
   * Show error toast
   */
  error(message, options = {}) {
    return this.show({
      type: 'error',
      message,
      duration: TIME.SEVEN_SECONDS, // Errors stay longer
      ...options,
    });
  }

  /**
   * Show warning toast
   */
  warning(message, options = {}) {
    return this.show({
      type: 'warning',
      message,
      ...options,
    });
  }

  /**
   * Show info toast
   */
  info(message, options = {}) {
    return this.show({
      type: 'info',
      message,
      ...options,
    });
  }

  /**
   * Dismiss a toast by ID
   */
  dismiss(id) {
    const toast = this.toasts.get(id);
    if (toast) {
      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');

      // Remove from DOM after animation
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        this.toasts.delete(id);
      }, UI.ANIMATION_DURATION_MS);
    }
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    this.toasts.forEach((toast, id) => {
      this.dismiss(id);
    });
  }

  /**
   * Create toast element
   */
  _createToast(id, type, message, dismissible, action) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
    toast.dataset.toastId = id;

    const icon = this._getIcon(type);
    const dismissBtn = dismissible
      ? `<button class="toast-dismiss" aria-label="Dismiss notification" data-dismiss="${id}">×</button>`
      : '';

    const actionBtn = action
      ? `<button class="toast-action" data-action="${id}">${action.label}</button>`
      : '';

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon" aria-hidden="true">${icon}</span>
        <span class="toast-message">${message}</span>
      </div>
      ${actionBtn}
      ${dismissBtn}
    `;

    // Attach event listeners
    if (dismissible) {
      const dismissButton = toast.querySelector('.toast-dismiss');
      dismissButton.addEventListener('click', () => {
        this.dismiss(id);
      });
    }

    if (action) {
      const actionButton = toast.querySelector('.toast-action');
      actionButton.addEventListener('click', () => {
        if (action.onClick) {
          action.onClick();
        }
        this.dismiss(id);
      });
    }

    return toast;
  }

  /**
   * Get icon for toast type
   */
  _getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type] || icons.info;
  }

  /**
   * Handle storage quota errors
   */
  handleStorageError(_error) {
    this.error(
      'Storage is full. Please export your progress or clear some data.',
      {
        duration: TIME.TEN_SECONDS,
        action: {
          label: 'Go to Progress',
          onClick: () => {
            window.location.hash = '#/progress';
          },
        },
      }
    );
  }

  /**
   * Handle network errors
   */
  handleNetworkError() {
    this.error('Unable to load data. Please check your connection.', {
      duration: TIME.SEVEN_SECONDS,
      action: {
        label: 'Retry',
        onClick: () => {
          window.location.reload();
        },
      },
    });
  }

  /**
   * Handle generic errors
   */
  handleError(error, context = '') {
    const message = error.message || 'An unexpected error occurred';
    const contextMsg = context ? `${context}: ${message}` : message;

    // Check for specific error types
    if (message.includes('quota') || message.includes('storage')) {
      this.handleStorageError(error);
    } else if (message.includes('network') || message.includes('fetch')) {
      this.handleNetworkError(error);
    } else {
      this.error(contextMsg);
    }
  }
}

// Create singleton instance
const toastNotification = new ToastNotification();

export default toastNotification;
