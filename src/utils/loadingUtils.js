/**
 * Loading utilities for consistent loading states across components
 */

import LoadingSpinner from '../components/LoadingSpinner.js';
import EmptyState from '../components/EmptyState.js';

/**
 * Create a standardized async loading pattern for components
 * @param {HTMLElement} container - Container element to show loading in
 * @param {Function} loadDataFn - Async function that loads the data
 * @param {Function} renderContentFn - Function that renders the loaded content
 * @param {Object} options - Loading options
 * @returns {Promise} Promise that resolves when loading is complete
 */
export async function createAsyncLoader(
  container,
  loadDataFn,
  renderContentFn,
  options = {}
) {
  const {
    loadingMessage = 'Loading...',
    errorTitle = 'Error Loading Content',
    errorMessage = 'Failed to load content. Please try again.',
    retryLabel = 'Retry',
    onError = null,
  } = options;

  // Show loading state
  container.innerHTML = LoadingSpinner.render(loadingMessage);

  try {
    // Load data
    const data = await loadDataFn();

    // Clear loading and render content
    container.innerHTML = '';
    const content = await renderContentFn(data);

    if (content instanceof HTMLElement) {
      container.appendChild(content);
    } else {
      container.innerHTML = content;
    }

    return data;
  } catch (error) {
    console.error('Error in async loader:', error);

    // Handle error
    if (onError) {
      onError(error);
    }

    // Show error state
    const errorState = EmptyState.create({
      icon: '⚠️',
      title: errorTitle,
      message: errorMessage,
      action: {
        label: retryLabel,
        onClick: () =>
          createAsyncLoader(container, loadDataFn, renderContentFn, options),
      },
    });

    container.innerHTML = '';
    container.appendChild(errorState);

    throw error;
  }
}

/**
 * Create a loading state with timeout for better UX
 * @param {HTMLElement} container - Container element
 * @param {Function} loadDataFn - Async function that loads data
 * @param {Function} renderContentFn - Function that renders content
 * @param {Object} options - Options including timeout
 * @returns {Promise} Promise that resolves when loading is complete
 */
export async function createTimedAsyncLoader(
  container,
  loadDataFn,
  renderContentFn,
  options = {}
) {
  const { timeout = 0, ...loaderOptions } = options;

  if (timeout > 0) {
    // Use setTimeout for better perceived performance
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await createAsyncLoader(
            container,
            loadDataFn,
            renderContentFn,
            loaderOptions
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, timeout);
    });
  }

  return createAsyncLoader(
    container,
    loadDataFn,
    renderContentFn,
    loaderOptions
  );
}

/**
 * Standard error handler for component loading
 * @param {Error} error - The error that occurred
 * @param {string} context - Context where the error occurred
 * @param {Function} onRetry - Optional retry function
 * @returns {HTMLElement} Error state element
 */
export function createErrorState(
  error,
  context = 'loading content',
  onRetry = null
) {
  console.error(`Error ${context}:`, error);

  return EmptyState.create({
    icon: '⚠️',
    title: 'Something went wrong',
    message: `Failed to load ${context}. Please try again.`,
    action: onRetry
      ? {
          label: 'Retry',
          onClick: onRetry,
        }
      : null,
  });
}

/**
 * Create a not found state for missing resources
 * @param {string} resourceType - Type of resource (e.g., 'module', 'quiz')
 * @param {Function} onBack - Function to call when back button is clicked
 * @returns {HTMLElement} Not found state element
 */
export function createNotFoundState(resourceType = 'content', onBack = null) {
  return EmptyState.create({
    icon: '🔍',
    title: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Not Found`,
    message: `The requested ${resourceType} could not be found.`,
    action: onBack
      ? {
          label: 'Go Back',
          onClick: onBack,
        }
      : null,
  });
}
