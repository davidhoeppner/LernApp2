/**
 * IHK Module List View
 * Displays all IHK modules with filtering and search
 */

/* global setTimeout */

import LoadingSpinner from './LoadingSpinner.js';
import EmptyState from './EmptyState.js';
import toastNotification from './ToastNotification.js';
import accessibilityHelper from '../utils/AccessibilityHelper.js';

class IHKModuleListView {
  constructor(services) {
    this.services = services;
    this.ihkContentService = services.ihkContentService;
    this.router = services.router;
    this.modules = [];
    this.filteredModules = [];
    this.currentFilter = 'all';
  }

  /**
   * Render the module list view
   */
  async render() {
    const container = document.createElement('div');
    container.className = 'ihk-module-list-view';
    container.innerHTML = LoadingSpinner.render('Loading IHK modules...');

    // Load modules asynchronously
    setTimeout(async () => {
      try {
        await this.loadModules();
        container.innerHTML = '';
        container.appendChild(this.renderContent());
        accessibilityHelper.announce(
          `${this.modules.length} IHK modules loaded`
        );
      } catch (error) {
        console.error('Error loading IHK modules:', error);
        const errorState = EmptyState.create({
          icon: '⚠️',
          title: 'Error Loading Modules',
          message: 'Failed to load IHK modules. Please try again.',
          action: {
            label: 'Retry',
            onClick: () => this.render(),
          },
        });
        container.innerHTML = '';
        container.appendChild(errorState);
        toastNotification.error('Failed to load IHK modules');
      }
    }, 0);

    return container;
  }

  /**
   * Load all modules
   */
  async loadModules() {
    // Load all modules by searching with no filters
    this.modules = await this.ihkContentService.searchContent('', {});
    this.filteredModules = [...this.modules];
  }

  /**
   * Render the main content
   */
  renderContent() {
    const content = document.createElement('div');
    content.className = 'ihk-module-list-content';

    // Header
    const header = this.renderHeader();
    content.appendChild(header);

    // Filter buttons
    const filters = this.renderFilters();
    content.appendChild(filters);

    // Module grid
    const moduleGrid = this.renderModuleGrid();
    content.appendChild(moduleGrid);

    return content;
  }

  /**
   * Render header
   */
  renderHeader() {
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `
      <h1>IHK Module</h1>
      <p class="subtitle">Alle Lernmodule für die IHK Abschlussprüfung Teil 2</p>
    `;
    return header;
  }

  /**
   * Render filter buttons
   */
  renderFilters() {
    const filters = document.createElement('div');
    filters.className = 'module-filters';
    filters.innerHTML = `
      <div class="filter-buttons" role="group" aria-label="Filter modules">
        <button class="filter-btn active" data-filter="all">
          Alle (${this.modules.length})
        </button>
        <button class="filter-btn" data-filter="completed">
          Abgeschlossen (${this.modules.filter(m => m.completed).length})
        </button>
        <button class="filter-btn" data-filter="in-progress">
          In Bearbeitung (${this.modules.filter(m => m.inProgress).length})
        </button>
        <button class="filter-btn" data-filter="not-started">
          Nicht begonnen (${this.modules.filter(m => !m.completed && !m.inProgress).length})
        </button>
        <button class="filter-btn" data-filter="new-2025">
          Neu 2025 (${this.modules.filter(m => m.newIn2025).length})
        </button>
      </div>
    `;

    // Attach event listeners
    const buttons = filters.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => this.handleFilterChange(btn));
    });

    return filters;
  }

  /**
   * Handle filter change
   */
  handleFilterChange(button) {
    const filter = button.dataset.filter;
    this.currentFilter = filter;

    // Update active state
    const allButtons = button.parentElement.querySelectorAll('.filter-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Filter modules
    this.applyFilter(filter);

    // Re-render module grid
    const moduleGrid = document.querySelector('.module-grid');
    if (moduleGrid) {
      const newGrid = this.renderModuleGrid();
      moduleGrid.replaceWith(newGrid);
    }

    accessibilityHelper.announce(
      `Showing ${this.filteredModules.length} modules`
    );
  }

  /**
   * Apply filter to modules
   */
  applyFilter(filter) {
    switch (filter) {
      case 'completed':
        this.filteredModules = this.modules.filter(m => m.completed);
        break;
      case 'in-progress':
        this.filteredModules = this.modules.filter(m => m.inProgress);
        break;
      case 'not-started':
        this.filteredModules = this.modules.filter(
          m => !m.completed && !m.inProgress
        );
        break;
      case 'new-2025':
        this.filteredModules = this.modules.filter(m => m.newIn2025);
        break;
      default:
        this.filteredModules = [...this.modules];
    }
  }

  /**
   * Render module grid
   */
  renderModuleGrid() {
    const grid = document.createElement('div');
    grid.className = 'module-grid';

    if (this.filteredModules.length === 0) {
      grid.appendChild(
        EmptyState.create({
          icon: '📚',
          title: 'No Modules Found',
          message: 'Try changing the filter to see more modules.',
        })
      );
      return grid;
    }

    this.filteredModules.forEach(module => {
      const card = this.renderModuleCard(module);
      grid.appendChild(card);
    });

    return grid;
  }

  /**
   * Render a single module card
   */
  renderModuleCard(module) {
    const card = document.createElement('article');
    card.className = 'module-card';
    if (module.completed) card.classList.add('completed');
    if (module.inProgress) card.classList.add('in-progress');

    const statusBadge = module.completed
      ? '<span class="badge badge-success">✓ Abgeschlossen</span>'
      : module.inProgress
        ? '<span class="badge badge-info">In Bearbeitung</span>'
        : '';

    const newBadge = module.newIn2025
      ? '<span class="badge badge-new">✨ Neu 2025</span>'
      : '';

    const relevanceBadge =
      module.examRelevance === 'high'
        ? '<span class="badge badge-high">Hohe Relevanz</span>'
        : '';

    card.innerHTML = `
      <div class="module-card-header">
        <h3>${module.title}</h3>
        <div class="module-badges">
          ${statusBadge}
          ${newBadge}
          ${relevanceBadge}
        </div>
      </div>
      <p class="module-description">${module.description}</p>
      <div class="module-meta">
        <span class="category">${module.category}</span>
        <span class="difficulty difficulty-${module.difficulty}">
          ${this.getDifficultyLabel(module.difficulty)}
        </span>
        <span class="duration">
          <span aria-hidden="true">⏱️</span>
          ${module.estimatedDuration}min
        </span>
      </div>
      <div class="module-card-footer">
        <button 
          class="btn btn-primary"
          onclick="window.location.hash = '#/ihk/modules/${module.id}'"
          aria-label="View module: ${module.title}"
        >
          Modul öffnen
        </button>
      </div>
    `;

    return card;
  }

  /**
   * Get difficulty label
   */
  getDifficultyLabel(difficulty) {
    const labels = {
      beginner: 'Anfänger',
      intermediate: 'Fortgeschritten',
      advanced: 'Experte',
    };
    return labels[difficulty] || difficulty;
  }
}

export default IHKModuleListView;
