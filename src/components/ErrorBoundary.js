/* global setTimeout */
import { HTTP_STATUS, RETRY } from '../utils/constants.js';

/**
 * ErrorBoundary - Component for graceful error display
 * Provides a fallback UI when errors occur in views
 */
class ErrorBoundary {
  constructor() {
    this.hasError = false;
    this.error = null;
  }

  /**
   * Wrap a view render function with error boundary
   */
  static wrap(renderFn, context = {}) {
    return async (...args) => {
      try {
        const result = await renderFn.apply(context, args);
        return result;
      } catch (error) {
        console.error('Error in view:', error);
        return ErrorBoundary.renderError(error, context);
      }
    };
  }

  /**
   * Render error UI
   */
  static renderError(error) {
    const container = document.createElement('div');
    container.className = 'error-boundary';
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'assertive');

    const errorMessage = error.message || 'An unexpected error occurred';
    const isStorageError =
      error.message?.includes('quota') || error.message?.includes('storage');
    const isNetworkError =
      error.message?.includes('network') || error.message?.includes('fetch');
    const isNotFoundError =
      error.message?.includes('not found') ||
      error.message?.includes(String(HTTP_STATUS.NOT_FOUND));

    let userMessage = errorMessage;
    let actionButton = '';
    let icon = '⚠️';

    if (isStorageError) {
      userMessage =
        'Storage is full. Please clear some data or export your progress.';
      icon = '💾';
      actionButton = `
        <button class="btn-primary" onclick="window.location.hash = '#/progress'">
          Go to Progress
        </button>
      `;
    } else if (isNetworkError) {
      userMessage =
        'Unable to load data. Please check your connection and try again.';
      icon = '🌐';
      actionButton = `
        <button class="btn-primary" onclick="window.location.reload()">
          Retry
        </button>
      `;
    } else if (isNotFoundError) {
      userMessage = 'The requested content was not found.';
      icon = '🔍';
      actionButton = `
        <button class="btn-primary" onclick="window.location.hash = '#/'">
          Go Home
        </button>
      `;
    } else {
      actionButton = `
        <button class="btn-primary" onclick="window.location.reload()">
          Refresh Page
        </button>
        <button class="btn-secondary" onclick="window.location.hash = '#/'">
          Go Home
        </button>
      `;
    }

    container.innerHTML = `
      <div class="error-boundary-content">
        <div class="error-icon" aria-hidden="true">${icon}</div>
        <h2 class="error-title">Something went wrong</h2>
        <p class="error-message">${userMessage}</p>
        <div class="error-actions">
          ${actionButton}
        </div>
        <details class="error-details">
          <summary>Technical Details</summary>
          <pre class="error-stack">${error.stack || error.message}</pre>
        </details>
      </div>
    `;

    return container;
  }

  /**
   * Check if an error should not be retried
   */
  static isNonRetryableError(error) {
    const nonRetryablePatterns = [
      'not found',
      String(HTTP_STATUS.NOT_FOUND),
      'validation',
    ];
    return nonRetryablePatterns.some(pattern =>
      error.message?.includes(pattern)
    );
  }

  /**
   * Calculate wait time for retry with exponential backoff
   */
  static calculateBackoffDelay(attempt, baseDelay, backoffMultiplier) {
    return baseDelay * Math.pow(backoffMultiplier, attempt);
  }

  /**
   * Wait for specified milliseconds
   */
  static async wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Create a retry wrapper for async functions
   */
  static withRetry(fn, options = {}) {
    const {
      maxRetries = RETRY.MAX_ATTEMPTS,
      delay = RETRY.INITIAL_DELAY_MS,
      backoff = RETRY.BACKOFF_MULTIPLIER,
      onRetry = null,
    } = options;

    return async function retryWrapper(...args) {
      let lastError;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn.apply(this, args);
        } catch (error) {
          lastError = error;

          if (attempt < maxRetries) {
            if (ErrorBoundary.isNonRetryableError(error)) {
              throw error;
            }

            const waitTime = ErrorBoundary.calculateBackoffDelay(
              attempt,
              delay,
              backoff
            );

            if (onRetry) {
              onRetry(attempt + 1, maxRetries, waitTime, error);
            }

            await ErrorBoundary.wait(waitTime);
          }
        }
      }

      throw lastError;
    };
  }
}

export default ErrorBoundary;
