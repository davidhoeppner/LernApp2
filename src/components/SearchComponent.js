/**
 * SearchComponent - IHK content search with highlighting
 * Provides full-text search across modules and quizzes
 */

/* global setTimeout, clearTimeout */

class SearchComponent {
  constructor(ihkContentService) {
    this.ihkContentService = ihkContentService;
    this.searchResults = [];
    this.currentQuery = '';
    this.isSearching = false;
    this.debounceTimer = null;
  }

  /**
   * Update filters and re-run search if active
   */
  updateFilters(filters) {
    this.currentFilters = filters;

    // Re-run search if there's an active query
    if (this.currentQuery && this.resultsContainer) {
      this._performSearch(this.currentQuery, this.resultsContainer, filters);
    }
  }

  /**
   * Render the search component
   */
  render(container, filters = {}) {
    if (!container) {
      throw new Error('Container element is required');
    }

    this.currentFilters = filters;

    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-component';
    searchContainer.setAttribute('role', 'search');
    searchContainer.innerHTML = `
      <div class="search-input-wrapper">
        <label for="ihk-search-input" class="sr-only">IHK-Inhalte durchsuchen</label>
        <input
          type="search"
          id="ihk-search-input"
          class="search-input"
          placeholder="Module und Quizzes durchsuchen..."
          aria-label="Suchbegriff eingeben"
          aria-describedby="search-help"
          autocomplete="off"
        />
        <button
          class="search-clear-btn"
          aria-label="Suche löschen"
          style="display: none;"
        >
          <span aria-hidden="true">×</span>
        </button>
        <div class="search-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <div id="search-help" class="search-help" style="display: none;">
        Geben Sie mindestens 2 Zeichen ein, um zu suchen
      </div>
      <div class="search-results" role="region" aria-live="polite" aria-atomic="true">
        <!-- Results will be inserted here -->
      </div>
    `;

    container.appendChild(searchContainer);

    // Get elements
    const searchInput = searchContainer.querySelector('#ihk-search-input');
    const clearBtn = searchContainer.querySelector('.search-clear-btn');
    const resultsContainer = searchContainer.querySelector('.search-results');

    // Store reference for filter updates
    this.resultsContainer = resultsContainer;

    // Event listeners
    searchInput.addEventListener('input', e => {
      this._handleSearchInput(
        e.target.value,
        resultsContainer,
        this.currentFilters
      );
      clearBtn.style.display = e.target.value ? 'block' : 'none';
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      this._clearResults(resultsContainer);
      searchInput.focus();
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        this._clearResults(resultsContainer);
      }
    });

    return searchContainer;
  }

  /**
   * Handle search input with debouncing
   * @private
   */
  _handleSearchInput(query, resultsContainer, filters) {
    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Show help text for short queries
    const helpText = document.getElementById('search-help');
    if (query.length > 0 && query.length < 2) {
      helpText.style.display = 'block';
      this._clearResults(resultsContainer);
      return;
    } else {
      helpText.style.display = 'none';
    }

    // Clear results if query is empty
    if (!query.trim()) {
      this._clearResults(resultsContainer);
      return;
    }

    // Show loading state
    this._showLoading(resultsContainer);

    // Debounce search (300ms)
    this.debounceTimer = setTimeout(async () => {
      await this._performSearch(query, resultsContainer, filters);
    }, 300);
  }

  /**
   * Perform the actual search
   * @private
   */
  async _performSearch(query, resultsContainer, filters) {
    try {
      this.isSearching = true;
      this.currentQuery = query;

      // Search content
      const results = await this.ihkContentService.searchContent(
        query,
        filters
      );

      this.searchResults = results;

      // Render results
      this._renderResults(results, query, resultsContainer);
    } catch (error) {
      console.error('Search error:', error);
      this._showError(resultsContainer);
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Render search results with highlighting
   * @private
   */
  _renderResults(results, query, container) {
    if (results.length === 0) {
      container.innerHTML = `
        <div class="search-no-results">
          <p>Keine Ergebnisse für "${this._escapeHtml(query)}" gefunden.</p>
          <p class="search-hint">Versuchen Sie andere Suchbegriffe oder entfernen Sie Filter.</p>
        </div>
      `;
      return;
    }

    const resultsHtml = `
      <div class="search-results-header">
        <h3>${results.length} ${results.length === 1 ? 'Ergebnis' : 'Ergebnisse'} gefunden</h3>
      </div>
      <ul class="search-results-list">
        ${results.map(module => this._renderResultItem(module, query)).join('')}
      </ul>
    `;

    container.innerHTML = resultsHtml;

    // Add click handlers
    container.querySelectorAll('.search-result-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this._handleResultClick(results[index]);
      });

      // Keyboard support
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._handleResultClick(results[index]);
        }
      });
    });
  }

  /**
   * Render a single result item
   * @private
   */
  _renderResultItem(module, query) {
    const statusBadge = this._getStatusBadge(module);
    const relevanceBadge = this._getRelevanceBadge(module);
    const newBadge = module.newIn2025
      ? '<span class="badge badge-new">Neu 2025</span>'
      : '';
    const importantBadge = module.important
      ? '<span class="badge badge-important">Wichtig</span>'
      : '';

    // Highlight query in title and description
    const highlightedTitle = this._highlightText(module.title, query);
    const highlightedDescription = this._highlightText(
      module.description,
      query,
      150
    );

    return `
      <li class="search-result-item" tabindex="0" role="button" data-module-id="${module.id}">
        <div class="search-result-header">
          <h4 class="search-result-title">${highlightedTitle}</h4>
          <div class="search-result-badges">
            ${statusBadge}
            ${relevanceBadge}
            ${newBadge}
            ${importantBadge}
          </div>
        </div>
        <p class="search-result-description">${highlightedDescription}</p>
        <div class="search-result-meta">
          <span class="meta-item">
            <span class="meta-label">Kategorie:</span>
            <span class="meta-value">${this._escapeHtml(module.category)}</span>
          </span>
          <span class="meta-item">
            <span class="meta-label">Schwierigkeit:</span>
            <span class="meta-value">${this._getDifficultyLabel(module.difficulty)}</span>
          </span>
          <span class="meta-item">
            <span class="meta-label">Dauer:</span>
            <span class="meta-value">${module.estimatedTime} Min.</span>
          </span>
        </div>
      </li>
    `;
  }

  /**
   * Highlight search query in text
   * @private
   */
  _highlightText(text, query, maxLength = 0) {
    if (!text || !query) {
      return this._escapeHtml(text);
    }

    let processedText = text;

    // Truncate if needed
    if (maxLength > 0 && text.length > maxLength) {
      // Try to find query position for smart truncation
      const queryPos = text.toLowerCase().indexOf(query.toLowerCase());
      if (queryPos !== -1) {
        const start = Math.max(0, queryPos - 50);
        const end = Math.min(text.length, queryPos + query.length + 100);
        processedText =
          (start > 0 ? '...' : '') +
          text.substring(start, end) +
          (end < text.length ? '...' : '');
      } else {
        processedText = text.substring(0, maxLength) + '...';
      }
    }

    // Escape HTML first
    const escaped = this._escapeHtml(processedText);

    // Highlight query (case-insensitive)
    const regex = new RegExp(`(${this._escapeRegex(query)})`, 'gi');
    return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  /**
   * Get status badge HTML
   * @private
   */
  _getStatusBadge(module) {
    if (module.completed) {
      return '<span class="badge badge-success">Abgeschlossen</span>';
    } else if (module.inProgress) {
      return '<span class="badge badge-info">In Bearbeitung</span>';
    }
    return '<span class="badge badge-default">Nicht begonnen</span>';
  }

  /**
   * Get exam relevance badge HTML
   * @private
   */
  _getRelevanceBadge(module) {
    const relevanceMap = {
      high: { label: 'Hoch', class: 'badge-danger' },
      medium: { label: 'Mittel', class: 'badge-warning' },
      low: { label: 'Niedrig', class: 'badge-secondary' },
    };

    const relevance = relevanceMap[module.examRelevance] || relevanceMap.low;
    return `<span class="badge ${relevance.class}">${relevance.label}</span>`;
  }

  /**
   * Get difficulty label
   * @private
   */
  _getDifficultyLabel(difficulty) {
    const difficultyMap = {
      beginner: 'Grundlagen',
      intermediate: 'Fortgeschritten',
      advanced: 'Experte',
    };
    return difficultyMap[difficulty] || difficulty;
  }

  /**
   * Handle result item click
   * @private
   */
  _handleResultClick(module) {
    // Navigate to module detail view
    window.location.hash = `#/ihk/modules/${module.id}`;
  }

  /**
   * Show loading state
   * @private
   */
  _showLoading(container) {
    container.innerHTML = `
      <div class="search-loading">
        <div class="loading-spinner" role="status">
          <span class="sr-only">Suche läuft...</span>
        </div>
        <p>Suche läuft...</p>
      </div>
    `;
  }

  /**
   * Show error state
   * @private
   */
  _showError(container) {
    container.innerHTML = `
      <div class="search-error">
        <p>Ein Fehler ist bei der Suche aufgetreten.</p>
        <p class="search-hint">Bitte versuchen Sie es erneut.</p>
      </div>
    `;
  }

  /**
   * Clear search results
   * @private
   */
  _clearResults(container) {
    container.innerHTML = '';
    this.searchResults = [];
    this.currentQuery = '';
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   */
  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Escape regex special characters
   * @private
   */
  _escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

export default SearchComponent;
