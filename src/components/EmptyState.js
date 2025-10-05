/**
 * EmptyState - Component for displaying empty states
 * Provides user-friendly messages when lists or content are empty
 */
class EmptyState {
  /**
   * Create an empty state element
   */
  static create(options = {}) {
    const {
      icon = '📭',
      title = 'No items found',
      message = 'There are no items to display.',
      action = null,
      type = 'default',
    } = options;

    const container = document.createElement('div');
    container.className = `empty-state empty-state-${type}`;
    container.setAttribute('role', 'status');
    container.setAttribute('aria-label', title);

    const actionButton = action
      ? `<button class="btn-primary empty-state-action" data-action="empty-state">
           ${action.label}
         </button>`
      : '';

    container.innerHTML = `
      <div class="empty-state-content">
        <div class="empty-state-icon" aria-hidden="true">${icon}</div>
        <h3 class="empty-state-title">${title}</h3>
        <p class="empty-state-message">${message}</p>
        ${actionButton}
      </div>
    `;

    // Attach action handler
    if (action && action.onClick) {
      const button = container.querySelector('[data-action="empty-state"]');
      button.addEventListener('click', action.onClick);
    }

    return container;
  }

  /**
   * Create empty state for no modules
   */
  static noModules(filter = 'all') {
    const messages = {
      all: {
        title: 'No modules available',
        message: 'There are no learning modules available at the moment.',
      },
      completed: {
        title: 'No completed modules',
        message:
          "You haven't completed any modules yet. Start learning to see your progress here!",
      },
      'in-progress': {
        title: 'No modules in progress',
        message:
          "You don't have any modules in progress. Start a new module to begin learning!",
      },
      'not-started': {
        title: 'All modules started',
        message: "Great job! You've started all available modules.",
      },
    };

    const config = messages[filter] || messages.all;

    return EmptyState.create({
      icon: '📚',
      title: config.title,
      message: config.message,
      action:
        filter !== 'all'
          ? {
              label: 'View All Modules',
              onClick: () => {
                window.location.hash = '#/modules';
              },
            }
          : null,
    });
  }

  /**
   * Create empty state for no quizzes
   */
  static noQuizzes(_filter = 'all') {
    return EmptyState.create({
      icon: '📝',
      title: 'No quizzes available',
      message: 'There are no quizzes available at the moment.',
      action: {
        label: 'Browse Modules',
        onClick: () => {
          window.location.hash = '#/modules';
        },
      },
    });
  }

  /**
   * Create empty state for no quiz history
   */
  static noQuizHistory() {
    return EmptyState.create({
      icon: '📊',
      title: 'No quiz history',
      message:
        "You haven't taken any quizzes yet. Take a quiz to see your results here!",
      action: {
        label: 'Browse Quizzes',
        onClick: () => {
          window.location.hash = '#/quizzes';
        },
      },
    });
  }

  /**
   * Create empty state for no progress
   */
  static noProgress() {
    return EmptyState.create({
      icon: '🎯',
      title: 'No progress yet',
      message: 'Start learning to track your progress!',
      action: {
        label: 'Start Learning',
        onClick: () => {
          window.location.hash = '#/modules';
        },
      },
    });
  }

  /**
   * Create empty state for search results
   */
  static noSearchResults(query = '') {
    return EmptyState.create({
      icon: '🔍',
      title: 'No results found',
      message: query
        ? `No results found for "${query}". Try a different search term.`
        : 'No results found. Try adjusting your search.',
      type: 'search',
    });
  }

  /**
   * Create empty state for filtered results
   */
  static noFilteredResults(filterName = '') {
    return EmptyState.create({
      icon: '🔎',
      title: 'No matching items',
      message: filterName
        ? `No items match the "${filterName}" filter. Try a different filter.`
        : 'No items match your current filters.',
      type: 'filter',
    });
  }

  /**
   * Create empty state for errors
   */
  static error(message = 'Something went wrong') {
    return EmptyState.create({
      icon: '⚠️',
      title: 'Unable to load content',
      message: message,
      type: 'error',
      action: {
        label: 'Try Again',
        onClick: () => {
          window.location.reload();
        },
      },
    });
  }
}

export default EmptyState;
