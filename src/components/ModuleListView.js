import EmptyState from './EmptyState.js';
import LoadingSpinner from './LoadingSpinner.js';
import toastNotification from './ToastNotification.js';

/**
 * ModuleListView - Display all available learning modules
 */
class ModuleListView {
  constructor(services) {
    this.moduleService = services.moduleService;
    this.progressService = services.progressService;
    this.router = services.router;
    this.currentFilter = 'all';
  }

  /**
   * Render module list view
   */
  async render() {
    const container = document.createElement('main');
    container.className = 'module-list-view';
    container.id = 'main-content';
    container.setAttribute('role', 'main');
    container.setAttribute('aria-label', 'Learning modules page');

    // Show loading state
    const loadingSpinner = LoadingSpinner.create({
      message: 'Loading modules...',
      size: 'medium',
    });
    container.appendChild(loadingSpinner);

    try {
      const modules = await this.moduleService.getModules();
      this.modules = modules;

      // Remove loading spinner
      loadingSpinner.remove();

      container.innerHTML = `
        <div class="module-list-header">
          <h1 class="page-title">Learning Modules</h1>
          <p class="page-description">Browse and study our collection of learning modules</p>
        </div>

        ${this._renderFilters()}
        ${this._renderModuleGrid(modules)}
      `;

      this._attachEventListeners(container);
    } catch (error) {
      console.error('Error rendering module list:', error);
      toastNotification.error('Failed to load modules. Please try again.');

      // Remove loading spinner and show error
      loadingSpinner.remove();
      const errorState = EmptyState.error(
        'Unable to load modules. Please try again.'
      );
      container.appendChild(errorState);
    }

    return container;
  }

  /**
   * Render filter buttons
   */
  _renderFilters() {
    return `
      <div class="module-filters" role="group" aria-label="Filter modules by status">
        <button class="filter-btn active" data-filter="all" aria-pressed="true" aria-label="Show all modules">
          All Modules
        </button>
        <button class="filter-btn" data-filter="completed" aria-pressed="false" aria-label="Show completed modules only">
          Completed
        </button>
        <button class="filter-btn" data-filter="in-progress" aria-pressed="false" aria-label="Show in progress modules only">
          In Progress
        </button>
        <button class="filter-btn" data-filter="not-started" aria-pressed="false" aria-label="Show not started modules only">
          Not Started
        </button>
      </div>
    `;
  }

  /**
   * Render module grid
   */
  _renderModuleGrid(modules) {
    const filteredModules = this._filterModules(modules);

    if (filteredModules.length === 0) {
      const emptyState = EmptyState.noModules(this.currentFilter);
      return emptyState.outerHTML;
    }

    const moduleCards = filteredModules
      .map(module => this._renderModuleCard(module))
      .join('');

    return `
      <div class="module-grid" role="list" aria-label="Learning modules">
        ${moduleCards}
      </div>
    `;
  }

  /**
   * Render individual module card
   */
  _renderModuleCard(module) {
    const progress = module.completed ? 100 : module.inProgress ? 50 : 0;
    const statusBadge = this._getStatusBadge(module);
    const prerequisites =
      module.prerequisites && module.prerequisites.length > 0
        ? `<div class="module-prerequisites">
           <span class="prereq-label">Prerequisites:</span>
           <span class="prereq-count">${module.prerequisites.length} module${module.prerequisites.length > 1 ? 's' : ''}</span>
         </div>`
        : '';

    const actionText = module.completed
      ? 'Review'
      : module.inProgress
        ? 'Continue'
        : 'Start';

    return `
      <article class="module-card" data-module-id="${module.id}" role="listitem" aria-labelledby="module-title-${module.id}">
        <div class="module-card-header">
          <div class="module-category">${module.category || 'General'}</div>
          ${statusBadge}
        </div>

        <div class="module-card-body">
          <h3 id="module-title-${module.id}" class="module-title">${module.title}</h3>
          <p class="module-description">${module.description}</p>

          <div class="module-meta">
            <div class="module-duration">
              <span class="meta-icon" aria-hidden="true">⏱️</span>
              <span><span class="sr-only">Duration: </span>${module.duration || 30} minutes</span>
            </div>
            ${prerequisites}
          </div>

          <div class="module-progress">
            <div class="progress-bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100" aria-label="Module progress: ${progress} percent">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="progress-text" aria-hidden="true">${progress}% complete</span>
          </div>
        </div>

        <div class="module-card-footer">
          <button class="btn-primary btn-sm" data-action="view-module" data-module-id="${module.id}" aria-label="${actionText} module: ${module.title}">
            ${actionText} Module
          </button>
        </div>
      </article>
    `;
  }

  /**
   * Get status badge for module
   */
  _getStatusBadge(module) {
    if (module.completed) {
      return '<span class="badge badge-success">✓ Completed</span>';
    }
    if (module.inProgress) {
      return '<span class="badge badge-warning">In Progress</span>';
    }
    return '<span class="badge badge-default">Not Started</span>';
  }

  /**
   * Filter modules based on current filter
   */
  _filterModules(modules) {
    switch (this.currentFilter) {
      case 'completed':
        return modules.filter(m => m.completed);
      case 'in-progress':
        return modules.filter(m => m.inProgress && !m.completed);
      case 'not-started':
        return modules.filter(m => !m.completed && !m.inProgress);
      case 'all':
      default:
        return modules;
    }
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners(container) {
    // Filter buttons
    const filterButtons = container.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const filter = e.target.dataset.filter;
        this._handleFilterChange(filter, container);
      });
    });

    // View module buttons
    const viewButtons = container.querySelectorAll(
      '[data-action="view-module"]'
    );
    viewButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const moduleId = e.target.dataset.moduleId;
        window.location.hash = `#/modules/${moduleId}`;
      });
    });

    // Module card click (entire card clickable)
    const moduleCards = container.querySelectorAll('.module-card');
    moduleCards.forEach(card => {
      card.addEventListener('click', e => {
        // Don't trigger if clicking on button
        if (e.target.closest('button')) return;

        const moduleId = card.dataset.moduleId;
        window.location.hash = `#/modules/${moduleId}`;
      });

      // Add hover cursor
      card.style.cursor = 'pointer';
    });
  }

  /**
   * Handle filter change
   */
  _handleFilterChange(filter, container) {
    this.currentFilter = filter;

    // Update active filter button
    const filterButtons = container.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      if (btn.dataset.filter === filter) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Re-render module grid
    const moduleGridContainer =
      container.querySelector('.module-grid')?.parentElement;
    if (moduleGridContainer) {
      moduleGridContainer.innerHTML = this._renderModuleGrid(this.modules);

      // Re-attach event listeners for new module cards
      const viewButtons = moduleGridContainer.querySelectorAll(
        '[data-action="view-module"]'
      );
      viewButtons.forEach(btn => {
        btn.addEventListener('click', e => {
          const moduleId = e.target.dataset.moduleId;
          window.location.hash = `#/modules/${moduleId}`;
        });
      });

      const moduleCards = moduleGridContainer.querySelectorAll('.module-card');
      moduleCards.forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('button')) return;
          const moduleId = card.dataset.moduleId;
          window.location.hash = `#/modules/${moduleId}`;
        });
        card.style.cursor = 'pointer';
        card.setAttribute('tabindex', '0');

        // Add keyboard support for card click
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (!e.target.closest('button')) {
              e.preventDefault();
              const moduleId = card.dataset.moduleId;
              window.location.hash = `#/modules/${moduleId}`;
            }
          }
        });
      });
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Cleanup if needed
  }
}

export default ModuleListView;
