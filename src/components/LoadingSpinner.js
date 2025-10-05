/**
 * LoadingSpinner - Component for displaying loading states
 * Provides visual feedback during async operations
 */
class LoadingSpinner {
  /**
   * Render loading spinner as HTML string
   * @param {string} message - Loading message
   * @returns {string} HTML string
   */
  static render(message = 'Loading...') {
    return `
      <div class="loading-spinner loading-spinner-medium" role="status" aria-live="polite" aria-busy="true">
        <div class="spinner-content">
          <div class="spinner" aria-hidden="true">
            <div class="spinner-circle"></div>
          </div>
          <p class="spinner-message">${message}</p>
          <span class="sr-only">${message}</span>
        </div>
      </div>
    `;
  }

  /**
   * Create a loading spinner element
   */
  static create(options = {}) {
    const {
      size = 'medium',
      message = 'Loading...',
      fullscreen = false,
      overlay = false,
    } = options;

    const container = document.createElement('div');
    container.className = `loading-spinner loading-spinner-${size}`;
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-busy', 'true');

    if (fullscreen) {
      container.classList.add('loading-spinner-fullscreen');
    }

    if (overlay) {
      container.classList.add('loading-spinner-overlay');
    }

    container.innerHTML = `
      <div class="spinner-content">
        <div class="spinner" aria-hidden="true">
          <div class="spinner-circle"></div>
        </div>
        <p class="spinner-message">${message}</p>
        <span class="sr-only">${message}</span>
      </div>
    `;

    return container;
  }

  /**
   * Show loading spinner in a container
   */
  static show(container, options = {}) {
    const spinner = LoadingSpinner.create(options);
    spinner.dataset.loadingSpinner = 'true';

    // Clear container and add spinner
    const previousContent = container.innerHTML;
    container.innerHTML = '';
    container.appendChild(spinner);

    // Store previous content for restoration
    container.dataset.previousContent = previousContent;

    return spinner;
  }

  /**
   * Hide loading spinner and restore content
   */
  static hide(container) {
    const spinner = container.querySelector('[data-loading-spinner="true"]');
    if (spinner) {
      spinner.remove();
    }

    // Restore previous content if available
    if (container.dataset.previousContent) {
      container.innerHTML = container.dataset.previousContent;
      delete container.dataset.previousContent;
    }
  }

  /**
   * Wrap an async function with loading state
   */
  static async withLoading(container, asyncFn, _options = {}) {
    try {
      const result = await asyncFn();
      LoadingSpinner.hide(container);
      return result;
    } catch (error) {
      LoadingSpinner.hide(container);
      throw error;
    }
  }

  /**
   * Create inline loading indicator (for buttons, etc.)
   */
  static createInline(message = '') {
    const span = document.createElement('span');
    span.className = 'loading-inline';
    span.setAttribute('role', 'status');
    span.setAttribute('aria-live', 'polite');

    span.innerHTML = `
      <span class="spinner-inline" aria-hidden="true"></span>
      ${message ? `<span class="spinner-inline-text">${message}</span>` : ''}
      <span class="sr-only">Loading${message ? ': ' + message : ''}</span>
    `;

    return span;
  }

  /**
   * Show loading state on a button
   */
  static setButtonLoading(button, loading = true) {
    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.innerHTML;
      button.innerHTML = '';
      button.appendChild(LoadingSpinner.createInline());
      button.classList.add('btn-loading');
    } else {
      button.disabled = false;
      if (button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
        delete button.dataset.originalText;
      }
      button.classList.remove('btn-loading');
    }
  }

  /**
   * Create a skeleton loader for content
   */
  static createSkeleton(type = 'card', count = 1) {
    const container = document.createElement('div');
    container.className = 'skeleton-container';
    container.setAttribute('aria-busy', 'true');
    container.setAttribute('aria-label', 'Loading content');

    const skeletons = [];
    for (let i = 0; i < count; i++) {
      skeletons.push(LoadingSpinner._getSkeletonTemplate(type));
    }

    container.innerHTML = skeletons.join('');
    return container;
  }

  /**
   * Get skeleton template by type
   */
  static _getSkeletonTemplate(type) {
    switch (type) {
      case 'card':
        return `
          <div class="skeleton skeleton-card">
            <div class="skeleton-header">
              <div class="skeleton-line skeleton-line-short"></div>
            </div>
            <div class="skeleton-body">
              <div class="skeleton-line skeleton-line-long"></div>
              <div class="skeleton-line skeleton-line-medium"></div>
              <div class="skeleton-line skeleton-line-short"></div>
            </div>
          </div>
        `;
      case 'list':
        return `
          <div class="skeleton skeleton-list-item">
            <div class="skeleton-line skeleton-line-long"></div>
            <div class="skeleton-line skeleton-line-medium"></div>
          </div>
        `;
      case 'text':
        return `
          <div class="skeleton skeleton-text">
            <div class="skeleton-line skeleton-line-long"></div>
            <div class="skeleton-line skeleton-line-long"></div>
            <div class="skeleton-line skeleton-line-medium"></div>
          </div>
        `;
      default:
        return `<div class="skeleton skeleton-default"></div>`;
    }
  }
}

export default LoadingSpinner;
