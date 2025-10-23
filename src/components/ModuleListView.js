import EmptyState from './EmptyState.js';
import LoadingSpinner from './LoadingSpinner.js';
import toastNotification from './ToastNotification.js';

/**
 * ModuleListView - Display all available learning modules with specialization support
 */
class ModuleListView {
  constructor(services) {
    this.moduleService = services.moduleService;
    this.progressService = services.progressService;
    this.specializationService = services.specializationService;
    this.router = services.router;
    this.currentFilter = 'all';
    this.currentCategoryFilter = 'all';
  }

  /**
   * Render module list view
   */
  async render() {
    const container = document.createElement('main');
  container.className = 'module-list-view';
    container.setAttribute('role', 'main');
    container.setAttribute('aria-label', 'Learning modules page');

    // Show loading state
    const loadingSpinner = LoadingSpinner.create({
      message: 'Loading modules...',
      size: 'medium',
    });
    container.appendChild(loadingSpinner);

    try {
      // Get current specialization for filtering
      this.currentSpecialization =
        this.specializationService.getCurrentSpecialization();

      // Get all modules (let category filters handle the filtering)
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
        ${this._renderCategoryFilters()}
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
   * Render category filter buttons
   */
  _renderCategoryFilters() {
    const categories = this._getCategoryFilters();

    const categoryButtons = categories
      .map(
        category => `
      <button 
        class="category-filter-btn ${category.id === 'all' ? 'active' : ''}" 
        data-category="${category.id}" 
        aria-pressed="${category.id === 'all' ? 'true' : 'false'}"
        aria-label="Show ${category.name} modules"
        style="--category-color: ${category.color}"
      >
        <span class="category-icon" aria-hidden="true">${category.icon}</span>
        <span class="category-name">${category.name}</span>
      </button>
    `
      )
      .join('');

    return `
      <div class="module-category-filters" role="group" aria-label="Filter modules by category">
        <h3 class="category-filters-title">Filter by Category</h3>
        <div class="category-filters-buttons">
          ${categoryButtons}
        </div>
      </div>
    `;
  }

  /**
   * Get category filters - show all available three-tier categories
   */
  _getCategoryFilters() {
    const categories = [
      {
        id: 'all',
        name: 'All Categories',
        icon: '📚',
        color: '#6b7280',
      },
      {
        id: 'daten-prozessanalyse',
        name: 'Daten und Prozessanalyse',
        icon: '📊',
        color: '#2563eb',
      },
      {
        id: 'anwendungsentwicklung',
        name: 'Anwendungsentwicklung',
        icon: '💻',
        color: '#dc2626',
      },
      {
        id: 'allgemein',
        name: 'Allgemein',
        icon: '📖',
        color: '#059669',
      },
    ];

    return categories;
  }

  /**
   * Render module grid
   */
  _renderModuleGrid(modules) {
    console.warn(
      '🎯 Rendering',
      modules.length,
      'modules with filter:',
      this.currentCategoryFilter
    );
    const filteredModules = this._filterModules(modules);
    console.warn(
      '🎯 After filtering:',
      filteredModules.length,
      'modules remain'
    );

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
    // Add defensive checks for undefined module properties
    if (!module || !module.id) {
      console.warn('Invalid module data:', module);
      return '';
    }

    const title = module.title || 'Untitled Module';
    const description = module.description || 'No description available';
    const category = module.category || 'General';
    const duration = module.duration || module.estimatedTime || 30;

    const progress = module.completed ? 100 : module.inProgress ? 50 : 0;
    const statusBadge = this._getStatusBadge(module);
    const categoryIndicator = this._getCategoryIndicator(module);
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
      <article class="module-card ${categoryIndicator.cssClass}" data-module-id="${module.id}" data-category="${categoryIndicator.category}" role="listitem" aria-labelledby="module-title-${module.id}">
        <div class="module-card-header">
          <div class="module-category-display">
            <span class="category-indicator" style="background-color: ${categoryIndicator.color}" aria-hidden="true">${categoryIndicator.icon}</span>
            <span class="category-text">${categoryIndicator.displayName}</span>
          </div>
          ${statusBadge}
        </div>

        <div class="module-card-body">
          <h3 id="module-title-${module.id}" class="module-title">${title}</h3>
          <p class="module-description">${description}</p>

          <div class="module-meta">
            <div class="module-duration">
              <span class="meta-icon" aria-hidden="true">⏱️</span>
              <span><span class="sr-only">Duration: </span>${duration} minutes</span>
            </div>
            ${prerequisites}
          </div>

          <div class="module-progress">
            <div class="progress-bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100" aria-label="Module progress: ${progress} percent">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text" aria-hidden="true">${progress}% complete</div>
          </div>
        </div>

        <div class="module-card-footer">
          <button class="btn-primary btn-sm" data-action="view-module" data-module-id="${module.id}" aria-label="${actionText} module: ${title}">
            ${actionText} Module
          </button>
        </div>
      </article>
    `;
  }

  /**
   * Get category indicator for module using three-tier category system
   */
  _getCategoryIndicator(module) {
    // First check if module has three-tier category information
    if (module.threeTierCategory) {
      return this._getThreeTierCategoryIndicator(module.threeTierCategory);
    }

    // Fallback to legacy category mapping
    const categoryId = module.category || module.categoryId;

    if (!categoryId) {
      return this._getThreeTierCategoryIndicator('allgemein');
    }

    // Map legacy categories to three-tier system
    if (categoryId.includes('BP-DPA') || categoryId.includes('bp-dpa')) {
      return this._getThreeTierCategoryIndicator('daten-prozessanalyse');
    } else if (
      categoryId.includes('BP-AE') ||
      categoryId.includes('bp-ae') ||
      categoryId === 'BP-01' ||
      categoryId === 'BP-02' ||
      categoryId === 'BP-03' ||
      categoryId === 'BP-04' ||
      categoryId === 'BP-05'
    ) {
      return this._getThreeTierCategoryIndicator('anwendungsentwicklung');
    } else {
      return this._getThreeTierCategoryIndicator('allgemein');
    }
  }

  /**
   * Get three-tier category indicator configuration
   * @private
   */
  _getThreeTierCategoryIndicator(threeTierCategoryId) {
    const categoryConfigs = {
      'daten-prozessanalyse': {
        category: 'daten-prozessanalyse',
        cssClass: 'module-daten-prozessanalyse',
        icon: '📊',
        color: '#2563eb',
        displayName: 'Daten und Prozessanalyse',
      },
      anwendungsentwicklung: {
        category: 'anwendungsentwicklung',
        cssClass: 'module-anwendungsentwicklung',
        icon: '💻',
        color: '#dc2626',
        displayName: 'Anwendungsentwicklung',
      },
      allgemein: {
        category: 'allgemein',
        cssClass: 'module-allgemein',
        icon: '📖',
        color: '#059669',
        displayName: 'Allgemein',
      },
    };

    return categoryConfigs[threeTierCategoryId] || categoryConfigs['allgemein'];
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
   * Filter modules based on current filters
   */
  _filterModules(modules) {
    let filteredModules = modules;

    // Apply status filter
    switch (this.currentFilter) {
      case 'completed':
        filteredModules = filteredModules.filter(m => m.completed);
        break;
      case 'in-progress':
        filteredModules = filteredModules.filter(
          m => m.inProgress && !m.completed
        );
        break;
      case 'not-started':
        filteredModules = filteredModules.filter(
          m => !m.completed && !m.inProgress
        );
        break;
      case 'all':
      default:
        // No status filtering
        break;
    }

    // Apply category filter
    if (this.currentCategoryFilter !== 'all') {
      filteredModules = filteredModules.filter(module => {
        const categoryIndicator = this._getCategoryIndicator(module);
        return categoryIndicator.category === this.currentCategoryFilter;
      });
    }

    return filteredModules;
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners(container) {
    // Status filter buttons
    const filterButtons = container.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const filter = e.target.dataset.filter;
        this._handleFilterChange(filter, container);
      });
    });

    // Category filter buttons
    const categoryFilterButtons = container.querySelectorAll(
      '.category-filter-btn'
    );
    categoryFilterButtons.forEach((btn, index) => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        // Find the button element (in case we clicked on a child element)
        const button = e.target.closest('.category-filter-btn');
        const category = button
          ? button.dataset.category
          : btn.dataset.category;

        // console.log('🖱️ Category button clicked:', category);
        this._handleCategoryFilterChange(category, container);
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

    this._refreshModuleGrid(container);
  }

  /**
   * Handle category filter change
   */
  _handleCategoryFilterChange(category, container) {
    this.currentCategoryFilter = category;

    // Update active category filter button
    const categoryFilterButtons = container.querySelectorAll(
      '.category-filter-btn'
    );
    categoryFilterButtons.forEach(btn => {
      if (btn.dataset.category === category) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    this._refreshModuleGrid(container);
  }

  /**
   * Refresh module grid with current filters
   */
  _refreshModuleGrid(container) {
    // Find the existing module grid
    const existingModuleGrid = container.querySelector('.module-grid');

    if (existingModuleGrid) {
      // Replace just the module grid content
      const newModuleGridHTML = this._renderModuleGrid(this.modules);

      // Create a temporary container to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newModuleGridHTML;
      const newModuleGrid = tempDiv.querySelector('.module-grid');

      if (newModuleGrid) {
        // Replace the existing grid with the new one
        existingModuleGrid.parentNode.replaceChild(
          newModuleGrid,
          existingModuleGrid
        );

        // Re-attach event listeners for new module cards
        const viewButtons = newModuleGrid.querySelectorAll(
          '[data-action="view-module"]'
        );
        viewButtons.forEach(btn => {
          btn.addEventListener('click', e => {
            const moduleId = e.target.dataset.moduleId;
            window.location.hash = `#/modules/${moduleId}`;
          });
        });

        const moduleCards = newModuleGrid.querySelectorAll('.module-card');
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
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Cleanup if needed
  }
}

export default ModuleListView;
