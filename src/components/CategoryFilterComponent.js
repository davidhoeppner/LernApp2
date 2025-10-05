/* eslint-disable prettier/prettier */
/**
 * CategoryFilterComponent - Filter IHK content by categories, relevance, and difficulty
 */
class CategoryFilterComponent {
  constructor(onFilterChange) {
    this.onFilterChange = onFilterChange;
    this.storageKey = 'ihk-content-filters';

    // Load filters from localStorage or use defaults
    this.filters = this._loadFiltersFromStorage() || {
      category: 'all', // all, FÜ, BP, or specific category ID
      examRelevance: 'all', // all, high, medium, low
      newIn2025: false,
      difficulty: 'all', // all, beginner, intermediate, advanced
      learningStatus: 'all', // all, not-started, in-progress, completed
    };
  }

  /**
   * Render the filter component
   */
  render() {
    const container = document.createElement('div');
    container.className = 'category-filter-component';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Content filters');

    container.innerHTML = `
      <div class="filter-section">
        <div class="filter-header">
          <h3 class="filter-title">Filter Content</h3>
          <button class="btn-ghost btn-sm reset-filters" aria-label="Reset all filters">
            Reset
          </button>
        </div>

        <div class="filter-groups">
          ${this._renderCategoryFilter()}
          ${this._renderExamRelevanceFilter()}
          ${this._renderLearningStatusFilter()}
          ${this._renderNewIn2025Filter()}
          ${this._renderDifficultyFilter()}
        </div>

        <div class="active-filters" role="status" aria-live="polite">
          ${this._renderActiveFilters()}
        </div>
      </div>
    `;

    this._attachEventListeners(container);
    return container;
  }

  /**
   * Render category filter (FÜ/BP)
   */
  _renderCategoryFilter() {
    return `
      <div class="filter-group">
        <label class="filter-label" id="category-filter-label">
          Kategorie
        </label>
        <div class="filter-options" role="group" aria-labelledby="category-filter-label">
          <button 
            class="filter-chip ${this.filters.category === 'all' ? 'active' : ''}" 
            data-filter="category" 
            data-value="all"
            aria-pressed="${this.filters.category === 'all'}"
          >
            Alle
          </button>
          <button 
            class="filter-chip ${this.filters.category === 'FÜ' ? 'active' : ''}" 
            data-filter="category" 
            data-value="FÜ"
            aria-pressed="${this.filters.category === 'FÜ'}"
          >
            Fachrichtungsübergreifend (FÜ)
          </button>
          <button 
            class="filter-chip ${this.filters.category === 'BP' ? 'active' : ''}" 
            data-filter="category" 
            data-value="BP"
            aria-pressed="${this.filters.category === 'BP'}"
          >
            Berufsprofilgebend (BP)
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render exam relevance filter
   */
  _renderExamRelevanceFilter() {
    return `
      <div class="filter-group">
        <label class="filter-label" id="relevance-filter-label">
          Prüfungsrelevanz
        </label>
        <div class="filter-options" role="group" aria-labelledby="relevance-filter-label">
          <button 
            class="filter-chip ${this.filters.examRelevance === 'all' ? 'active' : ''}" 
            data-filter="examRelevance" 
            data-value="all"
            aria-pressed="${this.filters.examRelevance === 'all'}"
          >
            Alle
          </button>
          <button 
            class="filter-chip ${this.filters.examRelevance === 'high' ? 'active' : ''}" 
            data-filter="examRelevance" 
            data-value="high"
            aria-pressed="${this.filters.examRelevance === 'high'}"
          >
            <span class="relevance-indicator high" aria-hidden="true"></span>
            Hoch
          </button>
          <button 
            class="filter-chip ${this.filters.examRelevance === 'medium' ? 'active' : ''}" 
            data-filter="examRelevance" 
            data-value="medium"
            aria-pressed="${this.filters.examRelevance === 'medium'}"
          >
            <span class="relevance-indicator medium" aria-hidden="true"></span>
            Mittel
          </button>
          <button 
            class="filter-chip ${this.filters.examRelevance === 'low' ? 'active' : ''}" 
            data-filter="examRelevance" 
            data-value="low"
            aria-pressed="${this.filters.examRelevance === 'low'}"
          >
            <span class="relevance-indicator low" aria-hidden="true"></span>
            Niedrig
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render learning status filter
   */
  _renderLearningStatusFilter() {
    return `
      <div class="filter-group">
        <label class="filter-label" id="status-filter-label">
          Lernstatus
        </label>
        <div class="filter-options" role="group" aria-labelledby="status-filter-label">
          <button 
            class="filter-chip ${this.filters.learningStatus === 'all' ? 'active' : ''}" 
            data-filter="learningStatus" 
            data-value="all"
            aria-pressed="${this.filters.learningStatus === 'all'}"
          >
            Alle
          </button>
          <button 
            class="filter-chip ${this.filters.learningStatus === 'not-started' ? 'active' : ''}" 
            data-filter="learningStatus" 
            data-value="not-started"
            aria-pressed="${this.filters.learningStatus === 'not-started'}"
          >
            <span class="status-indicator not-started" aria-hidden="true"></span>
            Nicht begonnen
          </button>
          <button 
            class="filter-chip ${this.filters.learningStatus === 'in-progress' ? 'active' : ''}" 
            data-filter="learningStatus" 
            data-value="in-progress"
            aria-pressed="${this.filters.learningStatus === 'in-progress'}"
          >
            <span class="status-indicator in-progress" aria-hidden="true"></span>
            In Bearbeitung
          </button>
          <button 
            class="filter-chip ${this.filters.learningStatus === 'completed' ? 'active' : ''}" 
            data-filter="learningStatus" 
            data-value="completed"
            aria-pressed="${this.filters.learningStatus === 'completed'}"
          >
            <span class="status-indicator completed" aria-hidden="true"></span>
            Abgeschlossen
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render "Neu ab 2025" filter
   */
  _renderNewIn2025Filter() {
    return `
      <div class="filter-group">
        <label class="filter-label">
          <input 
            type="checkbox" 
            class="filter-checkbox" 
            data-filter="newIn2025"
            ${this.filters.newIn2025 ? 'checked' : ''}
            aria-label="Show only new topics from 2025"
          />
          <span class="badge badge-primary">Neu ab 2025</span>
        </label>
      </div>
    `;
  }

  /**
   * Render difficulty filter
   */
  _renderDifficultyFilter() {
    return `
      <div class="filter-group">
        <label class="filter-label" id="difficulty-filter-label">
          Schwierigkeitsgrad
        </label>
        <div class="filter-options" role="group" aria-labelledby="difficulty-filter-label">
          <button 
            class="filter-chip ${this.filters.difficulty === 'all' ? 'active' : ''}" 
            data-filter="difficulty" 
            data-value="all"
            aria-pressed="${this.filters.difficulty === 'all'}"
          >
            Alle
          </button>
          <button 
            class="filter-chip ${this.filters.difficulty === 'beginner' ? 'active' : ''}" 
            data-filter="difficulty" 
            data-value="beginner"
            aria-pressed="${this.filters.difficulty === 'beginner'}"
          >
            Grundlagen
          </button>
          <button 
            class="filter-chip ${this.filters.difficulty === 'intermediate' ? 'active' : ''}" 
            data-filter="difficulty" 
            data-value="intermediate"
            aria-pressed="${this.filters.difficulty === 'intermediate'}"
          >
            Fortgeschritten
          </button>
          <button 
            class="filter-chip ${this.filters.difficulty === 'advanced' ? 'active' : ''}" 
            data-filter="difficulty" 
            data-value="advanced"
            aria-pressed="${this.filters.difficulty === 'advanced'}"
          >
            Experte
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render active filters summary
   */
  _renderActiveFilters() {
    const activeFilters = [];

    if (this.filters.category !== 'all') {
      activeFilters.push(`Kategorie: ${this.filters.category}`);
    }
    if (this.filters.examRelevance !== 'all') {
      const relevanceLabels = {
        high: 'Hoch',
        medium: 'Mittel',
        low: 'Niedrig',
      };
      activeFilters.push(
        `Relevanz: ${relevanceLabels[this.filters.examRelevance]}`
      );
    }
    if (this.filters.newIn2025) {
      activeFilters.push('Neu ab 2025');
    }
    if (this.filters.difficulty !== 'all') {
      const difficultyLabels = {
        beginner: 'Grundlagen',
        intermediate: 'Fortgeschritten',
        advanced: 'Experte',
      };
      activeFilters.push(
        `Schwierigkeit: ${difficultyLabels[this.filters.difficulty]}`
      );
    }
    if (this.filters.learningStatus !== 'all') {
      const statusLabels = {
        'not-started': 'Nicht begonnen',
        'in-progress': 'In Bearbeitung',
        completed: 'Abgeschlossen',
      };
      activeFilters.push(
        `Status: ${statusLabels[this.filters.learningStatus]}`
      );
    }

    if (activeFilters.length === 0) {
      return '<p class="no-active-filters">Keine Filter aktiv</p>';
    }

    return `
      <div class="active-filters-list">
        <span class="active-filters-label">Aktive Filter:</span>
        ${activeFilters.map(filter => `<span class="active-filter-tag">${filter} <button class="remove-filter" aria-label="Remove filter: ${filter}">×</button></span>`).join('')}
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners(container) {
    // Filter chip buttons
    const filterChips = container.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', e => {
        const filterType = e.currentTarget.dataset.filter;
        const value = e.currentTarget.dataset.value;
        this._handleFilterChange(filterType, value, container);
      });
    });

    // Checkbox filter
    const checkbox = container.querySelector('.filter-checkbox');
    if (checkbox) {
      checkbox.addEventListener('change', e => {
        this._handleFilterChange('newIn2025', e.target.checked, container);
      });
    }

    // Reset button
    const resetButton = container.querySelector('.reset-filters');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        this._resetFilters(container);
      });
    }

    // Remove filter buttons
    this._attachRemoveFilterListeners(container);
  }

  /**
   * Attach event listeners for remove filter buttons
   * @private
   */
  _attachRemoveFilterListeners(container) {
    const removeButtons = container.querySelectorAll('.remove-filter');
    removeButtons.forEach((button, index) => {
      button.addEventListener('click', e => {
        e.stopPropagation();
        this._removeFilterByIndex(index, container);
      });
    });
  }

  /**
   * Remove a specific filter by index
   * @private
   */
  _removeFilterByIndex(index, container) {
    const activeFilters = [];

    // Build list of active filters in same order as displayed
    if (this.filters.category !== 'all') {
      activeFilters.push({ type: 'category', value: 'all' });
    }
    if (this.filters.examRelevance !== 'all') {
      activeFilters.push({ type: 'examRelevance', value: 'all' });
    }
    if (this.filters.newIn2025) {
      activeFilters.push({ type: 'newIn2025', value: false });
    }
    if (this.filters.difficulty !== 'all') {
      activeFilters.push({ type: 'difficulty', value: 'all' });
    }
    if (this.filters.learningStatus !== 'all') {
      activeFilters.push({ type: 'learningStatus', value: 'all' });
    }

    // Remove the filter at the specified index
    if (index >= 0 && index < activeFilters.length) {
      const filterToRemove = activeFilters[index];
      this._handleFilterChange(
        filterToRemove.type,
        filterToRemove.value,
        container
      );
    }
  }

  /**
   * Handle filter change
   */
  _handleFilterChange(filterType, value, container) {
    this.filters[filterType] = value;

    // Save to localStorage
    this._saveFiltersToStorage();

    // Update UI
    this._updateFilterUI(container);

    // Notify parent component
    if (this.onFilterChange) {
      this.onFilterChange(this.filters);
    }
  }

  /**
   * Reset all filters
   */
  _resetFilters(container) {
    this.filters = {
      category: 'all',
      examRelevance: 'all',
      newIn2025: false,
      difficulty: 'all',
      learningStatus: 'all',
    };

    // Clear from localStorage
    this._clearFiltersFromStorage();

    // Update UI
    this._updateFilterUI(container);

    // Notify parent component
    if (this.onFilterChange) {
      this.onFilterChange(this.filters);
    }
  }

  /**
   * Update filter UI after change
   */
  _updateFilterUI(container) {
    // Update filter chips
    const filterChips = container.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      const filterType = chip.dataset.filter;
      const value = chip.dataset.value;
      const isActive = this.filters[filterType] === value;

      chip.classList.toggle('active', isActive);
      chip.setAttribute('aria-pressed', isActive);
    });

    // Update checkbox
    const checkbox = container.querySelector('.filter-checkbox');
    if (checkbox) {
      checkbox.checked = this.filters.newIn2025;
    }

    // Update active filters display
    const activeFiltersContainer = container.querySelector('.active-filters');
    if (activeFiltersContainer) {
      activeFiltersContainer.innerHTML = this._renderActiveFilters();
      // Re-attach remove filter listeners
      this._attachRemoveFilterListeners(container);
    }
  }

  /**
   * Get current filters
   */
  getFilters() {
    return { ...this.filters };
  }

  /**
   * Set filters programmatically
   */
  setFilters(filters, container) {
    this.filters = { ...this.filters, ...filters };
    this._saveFiltersToStorage();
    if (container) {
      this._updateFilterUI(container);
    }
  }

  /**
   * Load filters from localStorage
   * @private
   */
  _loadFiltersFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error);
    }
    return null;
  }

  /**
   * Save filters to localStorage
   * @private
   */
  _saveFiltersToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.filters));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }

  /**
   * Clear filters from localStorage
   * @private
   */
  _clearFiltersFromStorage() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear filters from localStorage:', error);
    }
  }
}

export default CategoryFilterComponent;
