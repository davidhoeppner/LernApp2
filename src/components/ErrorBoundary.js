/* global setTimeout */
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
      error.message?.includes('not found') || error.message?.includes('404');

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
   * Create a retry wrapper for async functions
   */
  static withRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = 2,
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
            // Don't retry on certain errors
            if (
              error.message?.includes('not found') ||
              error.message?.includes('404') ||
              error.message?.includes('validation')
            ) {
              throw error;
            }

            const waitTime = delay * Math.pow(backoff, attempt);

            if (onRetry) {
              onRetry(attempt + 1, maxRetries, waitTime, error);
            }

            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      throw lastError;
    };
  }
}

export default ErrorBoundary;
