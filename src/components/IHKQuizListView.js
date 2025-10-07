/**
 * IHK Quiz List View
 * Displays all IHK quizzes with filtering
 */

import accessibilityHelper from '../utils/AccessibilityHelper.js';
import { debounce } from '../utils/eventUtils.js';

import EmptyState from './EmptyState.js';
import LoadingSpinner from './LoadingSpinner.js';
import toastNotification from './ToastNotification.js';

class IHKQuizListView {
  constructor(services) {
    this.services = services;
    this.ihkContentService = services.ihkContentService;
    this.specializationService = services.specializationService;
    this.categoryMappingService = services.categoryMappingService;
    this.stateManager = services.stateManager;
    this.router = services.router;
    this.quizzes = [];

    // Initialize filter states with proper defaults
    this.currentCategoryFilter = 'all';
    this.currentStatusFilter = 'all';

    // Initialize filter state tracking
    this.filterInitialized = false;

    // Initialize debounced filter operations
    this.debouncedRefreshQuizGrid = debounce(
      container => this._performQuizGridRefresh(container),
      100, // 100ms debounce for responsive feel
      false
    );

    // Track filter operation state
    this.filterOperationInProgress = false;
    this.pendingFilterOperations = new Set();
  }

  /**
   * Render the quiz list view
   */
  async render() {
    const container = document.createElement('div');
    container.className = 'ihk-quiz-list-view';
    container.innerHTML = LoadingSpinner.render('Loading IHK quizzes...');

    // Load quizzes asynchronously
    window.setTimeout(async () => {
      try {
        await this.loadQuizzes();
        container.innerHTML = '';
        container.appendChild(this.renderContent());
        accessibilityHelper.announce(
          `${this.quizzes.length} IHK quizzes loaded`
        );
      } catch (error) {
        console.error('Error loading IHK quizzes:', error);

        // Get user-friendly error message
        const friendlyMessage = this._getUserFriendlyFilterErrorMessage(error, {
          operation: 'loading',
          quizCount: this.quizzes?.length || 0,
        });

        const errorState = EmptyState.create({
          icon: '⚠️',
          title: 'Error Loading Quizzes',
          message: friendlyMessage,
          action: {
            label: 'Retry',
            onClick: () => this.render(),
          },
        });
        container.innerHTML = '';
        container.appendChild(errorState);

        // Show appropriate notification based on error type
        const errorType = this._categorizeFilterError(error);
        if (errorType === 'network') {
          toastNotification.error(
            'Network error loading quizzes. Check your connection.'
          );
        } else {
          toastNotification.error('Failed to load IHK quizzes');
        }
      }
    }, 0);

    return container;
  }

  /**
   * Load all quizzes with validation
   */
  async loadQuizzes() {
    try {
      // Get all quizzes from IHKContentService
      this.quizzes = await this.ihkContentService.getAllQuizzes();

      // Validate quiz data structure
      if (!Array.isArray(this.quizzes)) {
        throw new Error('Invalid quiz data: expected array');
      }

      // Get current specialization for filtering
      this.currentSpecialization =
        this.specializationService.getCurrentSpecialization();

      // Enrich with progress data
      this.enrichQuizzesWithProgress();

      // Validate category data and show warnings if needed
      const validationReport = this._validateAllQuizCategories();
      this._showCategoryValidationWarnings(validationReport);

      // Log loading success
      console.warn('Quizzes loaded successfully:', {
        totalQuizzes: this.quizzes.length,
        validQuizzes: validationReport.validQuizzes,
        invalidQuizzes: validationReport.invalidQuizzes,
        categoryDistribution: validationReport.categoryDistribution,
      });
    } catch (error) {
      console.error('Error loading quizzes:', error);

      // Ensure quizzes array is always valid
      if (!Array.isArray(this.quizzes)) {
        this.quizzes = [];
      }

      throw error; // Re-throw to be handled by render method
    }
  }

  /**
   * Enrich quizzes with progress data
   */
  enrichQuizzesWithProgress() {
    const progress = this.stateManager.getState('progress') || {};
    const quizAttempts = progress.quizAttempts || [];

    this.quizzes = this.quizzes.map(quiz => {
      const attempts = quizAttempts.filter(a => a.quizId === quiz.id);
      const bestScore =
        attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null;
      const lastAttempt =
        attempts.length > 0 ? attempts[attempts.length - 1] : null;

      return {
        ...quiz,
        attempts: attempts.length,
        bestScore,
        lastAttempt,
        completed: bestScore !== null && bestScore >= 70,
      };
    });
  }

  /**
   * Render the main content
   */
  renderContent() {
    const content = document.createElement('div');
    content.className = 'ihk-quiz-list-content';

    // Header
    const header = this.renderHeader();
    content.appendChild(header);

    // Filters
    const filters = this.renderFilters();
    content.appendChild(filters);

    // Quiz grid
    const quizGrid = this.renderQuizGrid();
    content.appendChild(quizGrid);

    // Attach event listeners
    this.attachEventListeners(content);

    // Initialize filter states after rendering
    this._initializeFilterStates(content);

    return content;
  }

  /**
   * Render header
   */
  renderHeader() {
    const header = document.createElement('div');
    header.className = 'page-header';

    // Calculate initial quiz count
    const filteredQuizzes = this._filterQuizzes(this.quizzes);
    const countDisplay = this._createQuizCountDisplay(
      filteredQuizzes.length,
      this.quizzes.length
    );

    header.innerHTML = `
      <h1>IHK Quizzes</h1>
      <p class="subtitle">Teste dein Wissen mit prüfungsrelevanten Quizzes</p>
      <div class="quiz-count-display" role="status" aria-live="polite">
        ${countDisplay}
      </div>
    `;
    return header;
  }

  /**
   * Render filters
   */
  renderFilters() {
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'quiz-filters-container';

    // Status filters
    const statusFilters = this.renderStatusFilters();
    filtersContainer.appendChild(statusFilters);

    // Category filters (only if specialization is selected)
    if (this.currentSpecialization) {
      const categoryFilters = this.renderCategoryFilters();
      filtersContainer.appendChild(categoryFilters);
    }

    return filtersContainer;
  }

  /**
   * Render status filter buttons with proper initialization
   */
  renderStatusFilters() {
    // Ensure currentStatusFilter is initialized to 'all' if not set
    if (!this.currentStatusFilter) {
      this.currentStatusFilter = 'all';
    }

    const statusOptions = [
      { id: 'all', label: 'All Quizzes' },
      { id: 'completed', label: 'Completed' },
      { id: 'attempted', label: 'Attempted' },
      { id: 'not-started', label: 'Not Started' },
    ];

    const statusButtons = statusOptions
      .map(status => {
        const isActive = status.id === this.currentStatusFilter;
        return `
        <button 
          class="filter-btn ${isActive ? 'active' : ''}" 
          data-status="${status.id}" 
          aria-pressed="${isActive ? 'true' : 'false'}"
          aria-label="Show ${status.label.toLowerCase()}"
        >
          ${status.label}
        </button>
      `;
      })
      .join('');

    const statusFilters = document.createElement('div');
    statusFilters.className = 'quiz-status-filters';
    statusFilters.innerHTML = `
      <h3 class="filter-section-title">Filter by Status</h3>
      <div class="filter-buttons">
        ${statusButtons}
      </div>
    `;
    return statusFilters;
  }

  /**
   * Render category filter buttons with proper initialization
   */
  renderCategoryFilters() {
    const categories = this._getCategoryFilters();

    // Ensure currentCategoryFilter is initialized to 'all' if not set
    if (!this.currentCategoryFilter) {
      this.currentCategoryFilter = 'all';
    }

    const categoryButtons = categories
      .map(category => {
        const isActive = category.id === this.currentCategoryFilter;
        return `
        <button 
          class="category-filter-btn ${isActive ? 'active' : ''}" 
          data-category="${category.id}" 
          aria-pressed="${isActive ? 'true' : 'false'}"
          aria-label="Show ${category.name} quizzes"
          style="--category-color: ${category.color}"
        >
          <span class="category-icon" aria-hidden="true">${category.icon}</span>
          <span class="category-name">${category.name}</span>
        </button>
      `;
      })
      .join('');

    const categoryFilters = document.createElement('div');
    categoryFilters.className = 'quiz-category-filters';
    categoryFilters.innerHTML = `
      <h3 class="filter-section-title">Filter by Category</h3>
      <div class="category-filter-buttons">
        ${categoryButtons}
      </div>
    `;

    return categoryFilters;
  }

  /**
   * Get category filters using three-tier category system
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
   * Render quiz grid
   */
  renderQuizGrid() {
    const grid = document.createElement('div');
    grid.className = 'quiz-grid';

    const filteredQuizzes = this._filterQuizzes(this.quizzes);

    if (filteredQuizzes.length === 0) {
      const emptyState = this._createEnhancedEmptyState();
      grid.appendChild(emptyState);
      return grid;
    }

    filteredQuizzes.forEach(quiz => {
      const card = this.renderQuizCard(quiz);
      grid.appendChild(card);
    });

    return grid;
  }

  /**
   * Filter quizzes based on current filters with comprehensive error handling
   */
  _filterQuizzes(quizzes) {
    try {
      // Validate input
      if (!Array.isArray(quizzes)) {
        console.error('_filterQuizzes: Invalid quizzes input - not an array', {
          quizzes,
        });
        return [];
      }

      let filteredQuizzes = [...quizzes];
      const filterStartTime = performance.now();

      // Apply status filter with error handling
      try {
        filteredQuizzes = this._applyStatusFilter(filteredQuizzes);
      } catch (statusError) {
        console.error('Error applying status filter:', {
          error: statusError.message,
          currentStatusFilter: this.currentStatusFilter,
          quizCount: filteredQuizzes.length,
        });
        // Continue with unfiltered quizzes for status
      }

      // Apply category filter with error handling
      if (this.currentCategoryFilter !== 'all') {
        try {
          filteredQuizzes = this._applyCategoryFilter(filteredQuizzes);
        } catch (categoryError) {
          console.error('Error applying category filter:', {
            error: categoryError.message,
            currentCategoryFilter: this.currentCategoryFilter,
            quizCount: filteredQuizzes.length,
          });
          // Continue with status-filtered quizzes only
        }
      }

      const filterEndTime = performance.now();
      const filterDuration = filterEndTime - filterStartTime;

      // Log performance warning if filtering takes too long
      if (filterDuration > 100) {
        console.warn('Filter operation took longer than expected:', {
          duration: `${filterDuration.toFixed(2)}ms`,
          inputCount: quizzes.length,
          outputCount: filteredQuizzes.length,
          statusFilter: this.currentStatusFilter,
          categoryFilter: this.currentCategoryFilter,
        });
      }

      // Debug logging when enabled
      if (this._isDebugEnabled()) {
        console.warn('Filter operation completed:', {
          inputCount: quizzes.length,
          outputCount: filteredQuizzes.length,
          duration: `${filterDuration.toFixed(2)}ms`,
          statusFilter: this.currentStatusFilter,
          categoryFilter: this.currentCategoryFilter,
        });
      }

      return filteredQuizzes;
    } catch (error) {
      console.error('Critical error in _filterQuizzes:', {
        error: error.message,
        stack: error.stack,
        quizCount: quizzes?.length || 0,
        statusFilter: this.currentStatusFilter,
        categoryFilter: this.currentCategoryFilter,
        timestamp: new Date().toISOString(),
      });

      // Return all quizzes as fallback
      return Array.isArray(quizzes) ? quizzes : [];
    }
  }

  /**
   * Apply status filter with error handling
   * @private
   */
  _applyStatusFilter(quizzes) {
    switch (this.currentStatusFilter) {
      case 'completed':
        return quizzes.filter(quiz => {
          try {
            return (
              quiz && typeof quiz.completed === 'boolean' && quiz.completed
            );
          } catch (error) {
            console.warn(
              `Error checking completion status for quiz ${quiz?.id}:`,
              error
            );
            return false;
          }
        });
      case 'attempted':
        return quizzes.filter(quiz => {
          try {
            return (
              quiz &&
              typeof quiz.attempts === 'number' &&
              quiz.attempts > 0 &&
              (!quiz.completed || quiz.completed === false)
            );
          } catch (error) {
            console.warn(
              `Error checking attempt status for quiz ${quiz?.id}:`,
              error
            );
            return false;
          }
        });
      case 'not-started':
        return quizzes.filter(quiz => {
          try {
            return (
              quiz &&
              (typeof quiz.attempts === 'number' ? quiz.attempts === 0 : true)
            );
          } catch (error) {
            console.warn(
              `Error checking not-started status for quiz ${quiz?.id}:`,
              error
            );
            return false;
          }
        });
      case 'all':
      default:
        return quizzes;
    }
  }

  /**
   * Apply category filter with error handling
   * @private
   */
  _applyCategoryFilter(quizzes) {
    const categoryErrors = [];

    const filteredQuizzes = quizzes.filter(quiz => {
      try {
        const categoryIndicator = this._getCategoryIndicator(quiz);

        // Check if this was a fallback category
        if (categoryIndicator._isFallback) {
          categoryErrors.push({
            quizId: quiz?.id,
            reason: categoryIndicator._fallbackReason,
          });
        }

        return categoryIndicator.category === this.currentCategoryFilter;
      } catch (error) {
        console.warn(`Error filtering quiz ${quiz?.id} by category:`, {
          error: error.message,
          quizId: quiz?.id,
          targetCategory: this.currentCategoryFilter,
        });
        return false;
      }
    });

    // Log category errors if any occurred
    if (categoryErrors.length > 0) {
      console.warn('Category filtering encountered fallbacks:', {
        errorCount: categoryErrors.length,
        totalQuizzes: quizzes.length,
        targetCategory: this.currentCategoryFilter,
        errors: categoryErrors.slice(0, 5), // Log first 5 errors
      });
    }

    return filteredQuizzes;
  }

  /**
   * Render a single quiz card
   */
  renderQuizCard(quiz) {
    const categoryIndicator = this._getCategoryIndicator(quiz);

    const card = document.createElement('article');
    card.className = `quiz-card ${categoryIndicator.cssClass}`;
    card.setAttribute('data-category', categoryIndicator.category);
    if (quiz.completed) card.classList.add('completed');

    const statusBadge = quiz.completed
      ? '<span class="badge badge-success">✓ Bestanden</span>'
      : quiz.attempts > 0
        ? '<span class="badge badge-info">Versucht</span>'
        : '';

    const scoreDisplay =
      quiz.bestScore !== null
        ? `<div class="quiz-score">
           <span class="score-label">Beste Punktzahl:</span>
           <span class="score-value">${quiz.bestScore}%</span>
         </div>`
        : '';

    card.innerHTML = `
      <div class="quiz-card-header">
        <div class="quiz-title-section">
          <div class="quiz-category-display">
            <span class="category-indicator" style="background-color: ${categoryIndicator.color}" aria-hidden="true">${categoryIndicator.icon}</span>
            <span class="category-text">${categoryIndicator.displayName}</span>
          </div>
          <h3>${quiz.title}</h3>
        </div>
        <div class="quiz-badges">
          ${statusBadge}
        </div>
      </div>
      <p class="quiz-description">${quiz.description}</p>
      <div class="quiz-meta">
        <span class="difficulty difficulty-${quiz.difficulty}">
          ${this.getDifficultyLabel(quiz.difficulty)}
        </span>
        <span class="questions">
          <span aria-hidden="true">❓</span>
          ${quiz.questions.length} Fragen
        </span>
        ${
          quiz.timeLimit
            ? `
          <span class="time-limit">
            <span aria-hidden="true">⏱️</span>
            ${quiz.timeLimit}min
          </span>
        `
            : ''
        }
      </div>
      ${scoreDisplay}
      ${
        quiz.attempts > 0
          ? `
        <div class="quiz-attempts">
          Versuche: ${quiz.attempts}
        </div>
      `
          : ''
      }
      <div class="quiz-card-footer">
        <button 
          class="btn btn-primary"
          onclick="window.location.hash = '#/quizzes/${quiz.id}'"
          aria-label="Start quiz: ${quiz.title}"
        >
          ${quiz.attempts > 0 ? 'Quiz wiederholen' : 'Quiz starten'}
        </button>
      </div>
    `;

    return card;
  }

  /**
   * Get category indicator for quiz using CategoryMappingService
   */
  _getCategoryIndicator(quiz) {
    try {
      // Validate quiz data before processing
      if (!quiz) {
        console.warn('_getCategoryIndicator: Quiz object is null or undefined');
        return this._createFallbackCategoryIndicator('Quiz data missing');
      }

      if (!quiz.id) {
        console.warn('_getCategoryIndicator: Quiz missing ID field', { quiz });
        return this._createFallbackCategoryIndicator('Quiz ID missing');
      }

      // Use CategoryMappingService for consistent category detection
      const mappingResult =
        this.categoryMappingService.mapToThreeTierCategory(quiz);

      if (mappingResult && mappingResult.threeTierCategory) {
        // Log successful mapping for debugging when enabled
        if (this._isDebugEnabled()) {
          console.warn(`Category mapping successful for quiz ${quiz.id}:`, {
            quizId: quiz.id,
            originalCategory: quiz.category || quiz.categoryId,
            mappedCategory: mappingResult.threeTierCategory,
            mappingSource: mappingResult.source || 'unknown',
          });
        }
        return this._getThreeTierCategoryIndicator(
          mappingResult.threeTierCategory
        );
      } else {
        // Enhanced logging for mapping failures
        console.warn(`Category mapping failed for quiz ${quiz.id}:`, {
          quizId: quiz.id,
          quizTitle: quiz.title,
          originalCategory: quiz.category,
          originalCategoryId: quiz.categoryId,
          threeTierCategory: quiz.threeTierCategory,
          mappingResult: mappingResult,
          fallbackApplied: 'allgemein',
        });
        return this._createFallbackCategoryIndicator('Category mapping failed');
      }
    } catch (error) {
      // Comprehensive error logging with context
      console.error(
        `Error mapping category for quiz ${quiz?.id || 'unknown'}:`,
        {
          error: error.message,
          stack: error.stack,
          quizId: quiz?.id,
          quizTitle: quiz?.title,
          quizData: quiz
            ? {
                category: quiz.category,
                categoryId: quiz.categoryId,
                threeTierCategory: quiz.threeTierCategory,
              }
            : null,
          timestamp: new Date().toISOString(),
          fallbackApplied: 'allgemein',
        }
      );

      return this._createFallbackCategoryIndicator('Category processing error');
    }
  }

  /**
   * Create fallback category indicator with error context
   * @private
   */
  _createFallbackCategoryIndicator(reason) {
    const fallbackIndicator = this._getThreeTierCategoryIndicator('allgemein');

    // Add error context for debugging
    return {
      ...fallbackIndicator,
      _fallbackReason: reason,
      _isFallback: true,
    };
  }

  /**
   * Check if debug logging is enabled
   * @private
   */
  _isDebugEnabled() {
    // Check for debug flag in localStorage or URL params
    return (
      localStorage.getItem('ihk-debug') === 'true' ||
      new URLSearchParams(window.location.search).has('debug')
    );
  }

  /**
   * Get three-tier category indicator configuration
   * @private
   */
  _getThreeTierCategoryIndicator(threeTierCategoryId) {
    const categoryConfigs = {
      'daten-prozessanalyse': {
        category: 'daten-prozessanalyse',
        cssClass: 'quiz-daten-prozessanalyse',
        icon: '📊',
        color: '#2563eb',
        displayName: 'Daten und Prozessanalyse',
      },
      anwendungsentwicklung: {
        category: 'anwendungsentwicklung',
        cssClass: 'quiz-anwendungsentwicklung',
        icon: '💻',
        color: '#dc2626',
        displayName: 'Anwendungsentwicklung',
      },
      allgemein: {
        category: 'allgemein',
        cssClass: 'quiz-allgemein',
        icon: '📖',
        color: '#059669',
        displayName: 'Allgemein',
      },
    };

    return categoryConfigs[threeTierCategoryId] || categoryConfigs['allgemein'];
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

  /**
   * Attach event listeners
   */
  attachEventListeners(container) {
    // Status filter buttons
    const statusFilterButtons = container.querySelectorAll('[data-status]');
    statusFilterButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const status = e.currentTarget.dataset.status;
        this._handleStatusFilterChange(status, container);
      });
    });

    // Category filter buttons
    const categoryFilterButtons = container.querySelectorAll('[data-category]');
    categoryFilterButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const category = e.currentTarget.dataset.category;
        this._handleCategoryFilterChange(category, container);
      });
    });
  }

  /**
   * Handle status filter change with enhanced state persistence
   */
  _handleStatusFilterChange(status, container) {
    const operationId = `status-filter-${Date.now()}`;
    const startTime = performance.now();

    try {
      // Validate input
      if (!status || typeof status !== 'string') {
        console.warn(
          `Invalid status parameter received: ${status}. Ignoring filter change.`
        );
        return;
      }

      if (!container) {
        throw new Error('Container element is required');
      }

      // Store previous state for rollback if needed
      const previousState = {
        statusFilter: this.currentStatusFilter,
        categoryFilter: this.currentCategoryFilter, // Preserve category filter
        timestamp: Date.now(),
      };

      // Log filter change attempt
      if (this._isDebugEnabled()) {
        console.warn(`Starting status filter change (${operationId}):`, {
          fromStatus: previousState.statusFilter,
          toStatus: status,
          preservedCategoryFilter: previousState.categoryFilter,
          timestamp: new Date().toISOString(),
        });
      }

      // Validate status exists in available filters
      const availableStatuses = [
        'all',
        'completed',
        'attempted',
        'not-started',
      ];
      if (!availableStatuses.includes(status)) {
        throw new Error(
          `Invalid status: ${status}. Available: ${availableStatuses.join(', ')}`
        );
      }

      // Atomic update: Update internal state while preserving category filter
      this.currentStatusFilter = status;
      // Explicitly preserve category filter - no changes to this.currentCategoryFilter

      // Update visual state with error handling
      try {
        this._updateStatusFilterVisualState(status, container);
      } catch (visualError) {
        console.error(
          'Error updating status filter visual state:',
          visualError
        );
        // Rollback internal state
        this.currentStatusFilter = previousState.statusFilter;
        throw new Error(`Visual state update failed: ${visualError.message}`);
      }

      // Refresh quiz grid with combined filters
      try {
        this._refreshQuizGrid(container);
      } catch (gridError) {
        console.error(
          'Error refreshing quiz grid after status filter change:',
          gridError
        );
        // Don't rollback here - visual state is correct, just show fallback
        this._showFilterErrorFallback(container, gridError);
      }

      // Show visual feedback during operation
      this._showFilterOperationFeedback(container, 'status filtering');

      // Announce filter change for accessibility with result count
      try {
        const filteredQuizzes = this._filterQuizzes(this.quizzes);
        this._announceFilterChange('status', status, filteredQuizzes.length);
      } catch (a11yError) {
        console.warn('Failed to announce status filter change:', a11yError);
        // Non-critical error, continue
      }

      // Log successful completion
      const duration = performance.now() - startTime;
      if (this._isDebugEnabled()) {
        console.warn(`Status filter change completed (${operationId}):`, {
          status: status,
          preservedCategoryFilter: this.currentCategoryFilter,
          duration: `${duration.toFixed(2)}ms`,
          success: true,
        });
      }
    } catch (error) {
      const duration = performance.now() - startTime;

      // Comprehensive error logging
      console.error(`Status filter change failed (${operationId}):`, {
        error: error.message,
        stack: error.stack,
        targetStatus: status,
        currentStatus: this.currentStatusFilter,
        currentCategoryFilter: this.currentCategoryFilter,
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        containerExists: !!container,
      });

      // Show user-friendly error notification
      toastNotification.error(
        'Unable to apply status filter. Showing all quizzes.'
      );

      // Graceful fallback: Reset to "All" status while preserving category filter
      try {
        this._resetStatusFilterWithFallback(container);
      } catch (fallbackError) {
        console.error(
          'Critical error: Status filter fallback failed:',
          fallbackError
        );
        // Last resort: reload the entire view
        this._handleCriticalFilterError(container);
      }
    }
  }

  /**
   * Handle category filter change with comprehensive error handling and graceful fallback
   */
  _handleCategoryFilterChange(category, container) {
    const operationId = `category-filter-${Date.now()}`;
    const startTime = performance.now();

    try {
      // Validate inputs
      if (!category || typeof category !== 'string') {
        console.warn(
          `Invalid category parameter received: ${category}. Ignoring filter change.`
        );
        return;
      }

      if (!container) {
        throw new Error('Container element is required');
      }

      // Store previous state for potential rollback
      const previousState = {
        categoryFilter: this.currentCategoryFilter,
        statusFilter: this.currentStatusFilter, // Preserve status filter
        timestamp: Date.now(),
      };

      // Check if category filters are available (specialization must be selected)
      if (!this.currentSpecialization) {
        console.warn(
          'Category filter change ignored - no specialization selected'
        );
        // Silently ignore category filter changes when no specialization is selected
        return;
      }

      // Log filter change attempt
      if (this._isDebugEnabled()) {
        console.warn(`Starting category filter change (${operationId}):`, {
          fromCategory: previousState.categoryFilter,
          toCategory: category,
          preservedStatusFilter: previousState.statusFilter,
          timestamp: new Date().toISOString(),
        });
      }

      // Validate category exists in available filters
      const availableCategories = this._getCategoryFilters().map(cat => cat.id);
      if (!availableCategories.includes(category)) {
        throw new Error(
          `Invalid category: ${category}. Available: ${availableCategories.join(', ')}`
        );
      }

      // Atomic update: Update internal state while preserving status filter
      this.currentCategoryFilter = category;
      // Explicitly preserve status filter - no changes to this.currentStatusFilter

      // Update visual state with error handling
      try {
        this._updateCategoryFilterVisualState(category, container);
      } catch (visualError) {
        console.error('Error updating visual state:', visualError);
        // Rollback internal state
        this.currentCategoryFilter = previousState.categoryFilter;
        throw new Error(`Visual state update failed: ${visualError.message}`);
      }

      // Refresh quiz grid with error handling
      try {
        this._refreshQuizGridWithFallback(container);
      } catch (gridError) {
        console.error('Error refreshing quiz grid:', gridError);
        // Don't rollback here - visual state is correct, just show fallback
        this._showFilterErrorFallback(container, gridError);
      }

      // Show visual feedback during operation
      this._showFilterOperationFeedback(container, 'category filtering');

      // Announce filter change for accessibility with result count
      try {
        const filteredQuizzes = this._filterQuizzes(this.quizzes);
        this._announceFilterChange(
          'category',
          category,
          filteredQuizzes.length
        );
      } catch (a11yError) {
        console.warn('Failed to announce filter change:', a11yError);
        // Non-critical error, continue
      }

      // Log successful completion
      const duration = performance.now() - startTime;
      if (this._isDebugEnabled()) {
        console.warn(`Category filter change completed (${operationId}):`, {
          category: category,
          preservedStatusFilter: this.currentStatusFilter,
          duration: `${duration.toFixed(2)}ms`,
          success: true,
        });
      }
    } catch (error) {
      const duration = performance.now() - startTime;

      // Comprehensive error logging
      console.error(`Category filter change failed (${operationId}):`, {
        error: error.message,
        stack: error.stack,
        targetCategory: category,
        currentCategory: this.currentCategoryFilter,
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        containerExists: !!container,
      });

      // Show user-friendly error notification
      toastNotification.error(
        'Unable to apply category filter. Showing all quizzes.'
      );

      // Graceful fallback: Reset to "All Categories"
      try {
        this._resetToAllCategoriesWithFallback(container);
      } catch (fallbackError) {
        console.error(
          'Critical error: Fallback to all categories failed:',
          fallbackError
        );
        // Last resort: reload the entire view
        this._handleCriticalFilterError(container);
      }
    }
  }

  /**
   * Update category filter visual state atomically
   * @private
   */
  _updateCategoryFilterVisualState(category, container) {
    const categoryFilterButtons = container.querySelectorAll('[data-category]');

    if (categoryFilterButtons.length === 0) {
      // Category filters may not be rendered if no specialization is selected
      console.warn(
        'No category filter buttons found - category filters may not be rendered'
      );
      return;
    }

    const updates = [];

    // Prepare all visual updates
    categoryFilterButtons.forEach(btn => {
      const isActive = btn.dataset.category === category;
      updates.push({
        button: btn,
        isActive: isActive,
        shouldAddClass: isActive,
        shouldRemoveClass: !isActive,
        ariaPressed: isActive ? 'true' : 'false',
      });
    });

    // Apply all visual updates atomically
    updates.forEach(update => {
      try {
        if (update.shouldAddClass) {
          update.button.classList.add('active');
        }
        if (update.shouldRemoveClass) {
          update.button.classList.remove('active');
        }
        update.button.setAttribute('aria-pressed', update.ariaPressed);
      } catch (btnError) {
        console.warn('Error updating button state:', {
          error: btnError.message,
          buttonCategory: update.button.dataset.category,
        });
      }
    });
  }

  /**
   * Refresh quiz grid with fallback error handling
   * @private
   */
  _refreshQuizGridWithFallback(container) {
    try {
      this._refreshQuizGrid(container);
    } catch (error) {
      console.error('Quiz grid refresh failed, attempting fallback:', error);
      this._showFilterErrorFallback(container, error);
    }
  }

  /**
   * Show fallback state when filter operations fail
   * @private
   */
  _showFilterErrorFallback(container, error) {
    const quizGridContainer = container.querySelector('.quiz-grid');
    if (quizGridContainer) {
      // Get user-friendly error message
      const friendlyMessage = this._getUserFriendlyFilterErrorMessage(error, {
        operation: 'filtering',
        currentCategoryFilter: this.currentCategoryFilter,
        currentStatusFilter: this.currentStatusFilter,
      });

      const fallbackState = EmptyState.create({
        icon: '⚠️',
        title: 'Filter Error',
        message: friendlyMessage,
        action: {
          label: 'Reset Filters',
          onClick: () => this._resetAllFilters(container),
        },
      });

      quizGridContainer.innerHTML = '';
      quizGridContainer.appendChild(fallbackState);

      // Show notification with specific guidance
      const errorType = this._categorizeFilterError(error);
      const guidance = this._getFilterErrorGuidance(errorType, {
        currentCategoryFilter: this.currentCategoryFilter,
      });

      if (guidance) {
        toastNotification.warning(guidance);
      }
    }
  }

  /**
   * Reset to "All Categories" with error handling
   * @private
   */
  _resetToAllCategoriesWithFallback(container) {
    // Preserve status filter during category reset
    const preservedStatusFilter = this.currentStatusFilter;
    this.currentCategoryFilter = 'all';

    try {
      this._syncCategoryFilterVisualState(container);
      this._refreshQuizGrid(container);

      // Ensure status filter is preserved
      this.currentStatusFilter = preservedStatusFilter;

      console.log('Category filter reset to "all", status filter preserved:', {
        categoryFilter: this.currentCategoryFilter,
        statusFilter: this.currentStatusFilter,
      });
    } catch (error) {
      console.error('Failed to reset to all categories:', error);
      // Restore preserved status filter even on error
      this.currentStatusFilter = preservedStatusFilter;
      throw error;
    }
  }

  /**
   * Handle critical filter errors by reloading the view
   * @private
   */
  _handleCriticalFilterError(container) {
    console.error('Critical filter error - attempting view reload');

    // Show loading state
    container.innerHTML = LoadingSpinner.render('Reloading quizzes...');

    // Reload the entire view after a short delay
    setTimeout(() => {
      this.render()
        .then(newContainer => {
          if (container.parentNode) {
            container.parentNode.replaceChild(newContainer, container);
          }
        })
        .catch(reloadError => {
          console.error('Failed to reload view:', reloadError);
          // Show final fallback message
          container.innerHTML = `
          <div class="error-state">
            <h3>Unable to Load Quizzes</h3>
            <p>Please refresh the page to try again.</p>
            <button onclick="window.location.reload()" class="btn btn-primary">
              Refresh Page
            </button>
          </div>
        `;
        });
    }, 1000);
  }

  /**
   * Reset all filters to default state
   * @private
   */
  _resetAllFilters(container) {
    try {
      this.currentCategoryFilter = 'all';
      this.currentStatusFilter = 'all';

      this._syncCategoryFilterVisualState(container);
      this._syncStatusFilterVisualState(container);
      this._refreshQuizGrid(container);

      accessibilityHelper.announce('All filters have been reset');
      toastNotification.success('Filters reset successfully');
    } catch (error) {
      console.error('Error resetting filters:', error);
      toastNotification.error('Failed to reset filters');
    }
  }

  /**
   * Validate quiz category data and provide warnings
   * @private
   */
  _validateQuizCategory(quiz) {
    const validation = {
      isValid: false,
      warnings: [],
      errors: [],
      category: null,
      confidence: 'low',
    };

    // Basic quiz validation
    if (!quiz) {
      validation.errors.push('Quiz object is null or undefined');
      return validation;
    }

    if (!quiz.id) {
      validation.errors.push('Quiz missing required ID field');
      return validation;
    }

    // Category field validation
    const hasThreeTierCategory =
      quiz.threeTierCategory && typeof quiz.threeTierCategory === 'string';
    const hasLegacyCategory =
      quiz.category && typeof quiz.category === 'string';
    const hasLegacyCategoryId =
      quiz.categoryId && typeof quiz.categoryId === 'string';

    if (!hasThreeTierCategory && !hasLegacyCategory && !hasLegacyCategoryId) {
      validation.warnings.push(
        'Quiz has no category information - will default to "allgemein"'
      );
      validation.category = 'allgemein';
      validation.confidence = 'low';
    } else if (hasThreeTierCategory) {
      // Validate three-tier category format
      const validThreeTierCategories = [
        'daten-prozessanalyse',
        'anwendungsentwicklung',
        'allgemein',
      ];
      if (validThreeTierCategories.includes(quiz.threeTierCategory)) {
        validation.isValid = true;
        validation.category = quiz.threeTierCategory;
        validation.confidence = 'high';
      } else {
        validation.warnings.push(
          `Invalid threeTierCategory value: "${quiz.threeTierCategory}"`
        );
        validation.category = 'allgemein';
        validation.confidence = 'low';
      }
    } else {
      // Has legacy category data - will need mapping
      validation.warnings.push(
        'Quiz uses legacy category format - mapping required'
      );
      validation.confidence = 'medium';

      // Validate legacy category format
      if (hasLegacyCategory) {
        if (typeof quiz.category !== 'string' || quiz.category.trim() === '') {
          validation.warnings.push('Legacy category field is empty or invalid');
        }
      }

      if (hasLegacyCategoryId) {
        if (
          typeof quiz.categoryId !== 'string' ||
          quiz.categoryId.trim() === ''
        ) {
          validation.warnings.push(
            'Legacy categoryId field is empty or invalid'
          );
        }
      }
    }

    // Additional data quality checks
    if (
      !quiz.title ||
      typeof quiz.title !== 'string' ||
      quiz.title.trim() === ''
    ) {
      validation.warnings.push('Quiz missing or invalid title');
    }

    if (
      !quiz.questions ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length === 0
    ) {
      validation.warnings.push(
        'Quiz has no questions or invalid questions array'
      );
    }

    return validation;
  }

  /**
   * Validate all quizzes and generate category validation report
   * @private
   */
  _validateAllQuizCategories() {
    if (!Array.isArray(this.quizzes) || this.quizzes.length === 0) {
      return {
        totalQuizzes: 0,
        validQuizzes: 0,
        invalidQuizzes: 0,
        warnings: [],
        errors: [],
        categoryDistribution: {},
      };
    }

    const report = {
      totalQuizzes: this.quizzes.length,
      validQuizzes: 0,
      invalidQuizzes: 0,
      warnings: [],
      errors: [],
      categoryDistribution: {
        'daten-prozessanalyse': 0,
        anwendungsentwicklung: 0,
        allgemein: 0,
        unknown: 0,
      },
      validationDetails: [],
    };

    this.quizzes.forEach((quiz, index) => {
      const validation = this._validateQuizCategory(quiz);

      if (validation.isValid) {
        report.validQuizzes++;
      } else {
        report.invalidQuizzes++;
      }

      // Collect warnings and errors
      validation.warnings.forEach(warning => {
        report.warnings.push({
          quizId: quiz.id || `index-${index}`,
          quizTitle: quiz.title || 'Unknown',
          warning: warning,
        });
      });

      validation.errors.forEach(error => {
        report.errors.push({
          quizId: quiz.id || `index-${index}`,
          quizTitle: quiz.title || 'Unknown',
          error: error,
        });
      });

      // Update category distribution
      const category = validation.category || 'unknown';
      if (
        Object.prototype.hasOwnProperty.call(
          report.categoryDistribution,
          category
        )
      ) {
        report.categoryDistribution[category]++;
      } else {
        report.categoryDistribution['unknown']++;
      }

      // Store detailed validation info for debugging
      report.validationDetails.push({
        quizId: quiz.id,
        validation: validation,
      });
    });

    return report;
  }

  /**
   * Show category validation warnings to user
   * @private
   */
  _showCategoryValidationWarnings(validationReport) {
    if (
      !validationReport ||
      (validationReport.warnings.length === 0 &&
        validationReport.errors.length === 0)
    ) {
      return;
    }

    const errorCount = validationReport.errors.length;
    const warningCount = validationReport.warnings.length;

    if (errorCount > 0) {
      console.error('Category validation errors found:', {
        errorCount: errorCount,
        totalQuizzes: validationReport.totalQuizzes,
        errors: validationReport.errors.slice(0, 3), // Show first 3 errors
      });

      toastNotification.error(
        `${errorCount} quiz${errorCount > 1 ? 'zes have' : ' has'} category errors. Check console for details.`
      );
    }

    if (warningCount > 0) {
      console.warn('Category validation warnings found:', {
        warningCount: warningCount,
        totalQuizzes: validationReport.totalQuizzes,
        warnings: validationReport.warnings.slice(0, 5), // Show first 5 warnings
      });

      // Only show warning notification if there are many warnings
      if (warningCount > 5) {
        toastNotification.warning(
          `${warningCount} quiz${warningCount > 1 ? 'zes have' : ' has'} category warnings. Check console for details.`
        );
      }
    }

    // Log summary for debugging
    if (this._isDebugEnabled()) {
      console.warn('Category validation summary:', {
        totalQuizzes: validationReport.totalQuizzes,
        validQuizzes: validationReport.validQuizzes,
        invalidQuizzes: validationReport.invalidQuizzes,
        errorCount: errorCount,
        warningCount: warningCount,
        categoryDistribution: validationReport.categoryDistribution,
      });
    }
  }

  /**
   * Provide user-friendly error messages for filter failures
   * @private
   */
  _getUserFriendlyFilterErrorMessage(error, context = {}) {
    const errorType = this._categorizeFilterError(error);

    const messages = {
      'category-mapping':
        'Unable to determine quiz categories. Showing all quizzes.',
      'data-validation':
        'Some quiz data is invalid. Showing available quizzes.',
      performance: 'Filtering is taking longer than expected. Please wait...',
      network: 'Connection issue while filtering. Please try again.',
      unknown:
        'An unexpected error occurred while filtering. Showing all quizzes.',
    };

    const baseMessage = messages[errorType] || messages['unknown'];

    // Add context-specific guidance
    const guidance = this._getFilterErrorGuidance(errorType, context);

    return guidance ? `${baseMessage} ${guidance}` : baseMessage;
  }

  /**
   * Categorize filter errors for appropriate handling
   * @private
   */
  _categorizeFilterError(error) {
    if (!error || !error.message) {
      return 'unknown';
    }

    const message = error.message.toLowerCase();

    if (message.includes('category') || message.includes('mapping')) {
      return 'category-mapping';
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return 'data-validation';
    }

    if (message.includes('timeout') || message.includes('performance')) {
      return 'performance';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }

    return 'unknown';
  }

  /**
   * Get guidance for specific error types
   * @private
   */
  _getFilterErrorGuidance(errorType, context) {
    switch (errorType) {
      case 'category-mapping':
        return 'Try selecting "All Categories" to see all available quizzes.';
      case 'data-validation':
        return 'Some quizzes may not display correctly.';
      case 'performance':
        return 'Consider refreshing the page if this persists.';
      case 'network':
        return 'Check your internet connection and try again.';
      default:
        return 'Try refreshing the page or contact support if the problem continues.';
    }
  }

  /**
   * Get display name for category
   * @private
   */
  _getCategoryDisplayName(categoryId) {
    const categoryMap = {
      all: 'All Categories',
      'daten-prozessanalyse': 'Daten und Prozessanalyse',
      anwendungsentwicklung: 'Anwendungsentwicklung',
      allgemein: 'Allgemein',
    };
    return categoryMap[categoryId] || categoryId;
  }

  /**
   * Initialize filter states after rendering
   * @private
   */
  _initializeFilterStates(container) {
    if (this.filterInitialized) {
      return;
    }

    try {
      // Ensure "All Categories" is active by default
      this.currentCategoryFilter = 'all';
      this.currentStatusFilter = 'all';

      // Set correct initial ARIA states and CSS classes for category filters
      this._syncCategoryFilterVisualState(container);

      // Set correct initial ARIA states and CSS classes for status filters
      this._syncStatusFilterVisualState(container);

      this.filterInitialized = true;

      // Announce initial state for accessibility
      accessibilityHelper.announce(
        'Filters initialized. All categories and all statuses are shown.'
      );
    } catch (error) {
      console.error('Error initializing filter states:', error);
      toastNotification.error('Failed to initialize filters');
    }
  }

  /**
   * Sync category filter visual state with internal state
   * @private
   */
  _syncCategoryFilterVisualState(container) {
    const categoryFilterButtons = container.querySelectorAll('[data-category]');
    categoryFilterButtons.forEach(btn => {
      const isActive = btn.dataset.category === this.currentCategoryFilter;
      if (isActive) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  /**
   * Sync status filter visual state with internal state
   * @private
   */
  _syncStatusFilterVisualState(container) {
    const statusFilterButtons = container.querySelectorAll('[data-status]');
    statusFilterButtons.forEach(btn => {
      const isActive = btn.dataset.status === this.currentStatusFilter;
      if (isActive) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  /**
   * Refresh quiz grid with current filters (debounced for performance)
   */
  _refreshQuizGrid(container) {
    // Use debounced version to prevent UI blocking on rapid changes
    this.debouncedRefreshQuizGrid(container);
  }

  /**
   * Perform the actual quiz grid refresh with optimized rendering
   * @private
   */
  _performQuizGridRefresh(container) {
    const operationId = `refresh-${Date.now()}`;
    const startTime = performance.now();

    try {
      // Prevent concurrent refresh operations
      if (this.filterOperationInProgress) {
        console.warn('Filter operation already in progress, queuing refresh');
        this.pendingFilterOperations.add(operationId);
        return;
      }

      this.filterOperationInProgress = true;

      const quizGridContainer = container.querySelector('.quiz-grid');
      if (!quizGridContainer) {
        throw new Error('Quiz grid container not found');
      }

      // Add loading state to prevent layout flicker
      quizGridContainer.classList.add('refreshing');

      // Use requestAnimationFrame for smooth rendering
      requestAnimationFrame(() => {
        try {
          const filteredQuizzes = this._filterQuizzes(this.quizzes);

          // Clear existing content
          quizGridContainer.innerHTML = '';

          // Add content directly to the existing grid container
          if (filteredQuizzes.length === 0) {
            const emptyState = this._createEnhancedEmptyState();
            quizGridContainer.appendChild(emptyState);
          } else {
            filteredQuizzes.forEach(quiz => {
              const card = this.renderQuizCard(quiz);
              quizGridContainer.appendChild(card);
            });
          }

          quizGridContainer.classList.remove('refreshing');

          // Update quiz count display with feedback
          this._updateQuizCountDisplay(container);

          const duration = performance.now() - startTime;

          // Log performance metrics
          if (this._isDebugEnabled()) {
            console.warn(`Quiz grid refresh completed (${operationId}):`, {
              duration: `${duration.toFixed(2)}ms`,
              quizCount: this.quizzes.length,
              filteredCount: filteredQuizzes.length,
            });
          }

          // Process any pending operations
          this._processPendingFilterOperations(container);
        } catch (renderError) {
          console.error('Error during quiz grid rendering:', renderError);
          quizGridContainer.classList.remove('refreshing');
          this._showFilterErrorFallback(container, renderError);
        } finally {
          this.filterOperationInProgress = false;
        }
      });
    } catch (error) {
      console.error(`Quiz grid refresh failed (${operationId}):`, error);
      this.filterOperationInProgress = false;
      this._showFilterErrorFallback(container, error);
    }
  }

  /**
   * Process any pending filter operations
   * @private
   */
  _processPendingFilterOperations(container) {
    if (this.pendingFilterOperations.size > 0) {
      console.warn(
        `Processing ${this.pendingFilterOperations.size} pending filter operations`
      );
      this.pendingFilterOperations.clear();

      // Trigger one more refresh for any changes that occurred during the last operation
      setTimeout(() => {
        if (!this.filterOperationInProgress) {
          this._performQuizGridRefresh(container);
        }
      }, 10);
    }
  }

  /**
   * Update status filter visual state atomically
   * @private
   */
  _updateStatusFilterVisualState(status, container) {
    const statusFilterButtons = container.querySelectorAll('[data-status]');

    if (statusFilterButtons.length === 0) {
      throw new Error('No status filter buttons found in container');
    }

    const updates = [];

    // Prepare all visual updates
    statusFilterButtons.forEach(btn => {
      const isActive = btn.dataset.status === status;
      updates.push({
        button: btn,
        isActive: isActive,
        shouldAddClass: isActive,
        shouldRemoveClass: !isActive,
        ariaPressed: isActive ? 'true' : 'false',
      });
    });

    // Apply all visual updates atomically
    updates.forEach(update => {
      try {
        if (update.shouldAddClass) {
          update.button.classList.add('active');
        }
        if (update.shouldRemoveClass) {
          update.button.classList.remove('active');
        }
        update.button.setAttribute('aria-pressed', update.ariaPressed);
      } catch (btnError) {
        console.warn('Error updating status button state:', {
          error: btnError.message,
          buttonStatus: update.button.dataset.status,
        });
      }
    });
  }

  /**
   * Get display name for status filter
   * @private
   */
  _getStatusDisplayName(status) {
    const statusNames = {
      all: 'All Quizzes',
      completed: 'Completed',
      attempted: 'Attempted',
      'not-started': 'Not Started',
    };
    return statusNames[status] || status;
  }

  /**
   * Get display name for category filter
   * @private
   */
  // Duplicate method removed - use the other _getCategoryDisplayName implementation earlier in the file

  /**
   * Create enhanced empty state with specific messages based on current filter combination
   * Requirements: 1.6, 4.4
   * @private
   */
  _createEnhancedEmptyState() {
    const hasFilters =
      this.currentCategoryFilter !== 'all' ||
      this.currentStatusFilter !== 'all';

    if (!hasFilters) {
      // No filters applied - general empty state
      return EmptyState.create({
        icon: '📚',
        title: 'No IHK Quizzes Available',
        message:
          'There are currently no IHK quizzes available. Please check back later or contact support if this seems incorrect.',
        action: {
          label: 'Browse Modules',
          onClick: () => {
            window.location.hash = '#/modules';
          },
        },
      });
    }

    // Filters are applied - create specific message
    const categoryName = this._getCategoryDisplayName(
      this.currentCategoryFilter
    );
    const statusName = this._getStatusDisplayName(this.currentStatusFilter);

    // Build filter description
    const filterParts = [];
    if (this.currentCategoryFilter !== 'all') {
      filterParts.push(`category "${categoryName}"`);
    }
    if (this.currentStatusFilter !== 'all') {
      filterParts.push(`status "${statusName}"`);
    }

    const filterDescription = filterParts.join(' and ');
    const totalQuizzes = this.quizzes ? this.quizzes.length : 0;

    // Create specific message based on filter combination
    let message = `No quizzes match your current filters (${filterDescription}).`;

    if (totalQuizzes > 0) {
      message += ` There are ${totalQuizzes} total quizzes available.`;
    }

    // Add guidance on adjusting filters
    const suggestions = this._getFilterAdjustmentSuggestions();
    if (suggestions.length > 0) {
      message += ` Try ${suggestions.join(' or ')}.`;
    }

    return EmptyState.create({
      icon: '🔍',
      title: 'No Matching Quizzes',
      message: message,
      type: 'filter',
      action: {
        label: 'Clear All Filters',
        onClick: () => {
          this._resetAllFilters();
        },
      },
    });
  }

  /**
   * Get suggestions for adjusting filters based on current state
   * @private
   */
  _getFilterAdjustmentSuggestions() {
    const suggestions = [];

    if (this.currentCategoryFilter !== 'all') {
      suggestions.push('selecting "All Categories"');
    }

    if (this.currentStatusFilter !== 'all') {
      suggestions.push('selecting "All Quizzes"');
    }

    // Add specific suggestions based on available data
    if (this.quizzes && this.quizzes.length > 0) {
      const availableCategories = this._getAvailableCategories();
      const availableStatuses = this._getAvailableStatuses();

      if (
        this.currentCategoryFilter !== 'all' &&
        availableCategories.length > 1
      ) {
        const otherCategories = availableCategories.filter(
          cat => cat !== this.currentCategoryFilter
        );
        if (otherCategories.length > 0) {
          const categoryName = this._getCategoryDisplayName(otherCategories[0]);
          suggestions.push(`trying "${categoryName}"`);
        }
      }

      if (this.currentStatusFilter !== 'all' && availableStatuses.length > 1) {
        const otherStatuses = availableStatuses.filter(
          status => status !== this.currentStatusFilter
        );
        if (otherStatuses.length > 0) {
          const statusName = this._getStatusDisplayName(otherStatuses[0]);
          suggestions.push(`trying "${statusName}"`);
        }
      }
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions to avoid overwhelming
  }

  /**
   * Get available categories from current quiz data
   * @private
   */
  _getAvailableCategories() {
    if (!this.quizzes || this.quizzes.length === 0) return [];

    const categories = new Set();
    this.quizzes.forEach(quiz => {
      try {
        const categoryIndicator = this._getCategoryIndicator(quiz);
        if (categoryIndicator && categoryIndicator.category) {
          categories.add(categoryIndicator.category);
        }
      } catch (error) {
        // Skip quizzes with category errors
      }
    });

    return Array.from(categories);
  }

  /**
   * Get available statuses from current quiz data
   * @private
   */
  _getAvailableStatuses() {
    if (!this.quizzes || this.quizzes.length === 0) return [];

    const statuses = new Set();
    this.quizzes.forEach(quiz => {
      if (quiz.completed) {
        statuses.add('completed');
      } else if (quiz.attempts > 0) {
        statuses.add('attempted');
      } else {
        statuses.add('not-started');
      }
    });

    return Array.from(statuses);
  }

  /**
   * Reset all filters to default state
   * @private
   */
  // Duplicate method removed - the earlier _resetAllFilters(container) implementation is used

  /**
   * Create quiz count display text
   * Requirements: 6.3
   * @private
   */
  _createQuizCountDisplay(filteredCount, totalCount) {
    if (filteredCount === totalCount) {
      return `<span class="quiz-count-text">Showing all ${totalCount} quizzes</span>`;
    } else {
      return `<span class="quiz-count-text">Showing ${filteredCount} of ${totalCount} quizzes</span>`;
    }
  }

  /**
   * Update quiz count display in the header
   * Requirements: 6.3
   * @private
   */
  _updateQuizCountDisplay(container) {
    try {
      const countDisplay = container.querySelector('.quiz-count-display');
      if (!countDisplay) {
        console.warn('Quiz count display element not found');
        return;
      }

      const filteredQuizzes = this._filterQuizzes(this.quizzes);
      const newCountDisplay = this._createQuizCountDisplay(
        filteredQuizzes.length,
        this.quizzes.length
      );

      countDisplay.innerHTML = newCountDisplay;

      // Add visual feedback animation
      countDisplay.classList.add('updating');
      setTimeout(() => {
        countDisplay.classList.remove('updating');
      }, 300);
    } catch (error) {
      console.error('Error updating quiz count display:', error);
    }
  }

  /**
   * Show visual feedback during filter operations
   * Requirements: 6.3
   * @private
   */
  _showFilterOperationFeedback(container, operation = 'filtering') {
    try {
      // Add loading state to filter buttons
      const filterButtons = container.querySelectorAll(
        '.filter-btn, .category-filter-btn'
      );
      filterButtons.forEach(btn => {
        btn.classList.add('filtering');
        btn.disabled = true;
      });

      // Add loading state to quiz grid
      const quizGrid = container.querySelector('.quiz-grid');
      if (quizGrid) {
        quizGrid.classList.add('updating');
      }

      // Remove loading states after a short delay
      setTimeout(() => {
        filterButtons.forEach(btn => {
          btn.classList.remove('filtering');
          btn.disabled = false;
        });

        if (quizGrid) {
          quizGrid.classList.remove('updating');
        }
      }, 150); // Short delay for visual feedback
    } catch (error) {
      console.error('Error showing filter operation feedback:', error);
    }
  }

  /**
   * Announce filter changes with detailed information for screen readers
   * Requirements: 6.3
   * @private
   */
  _announceFilterChange(filterType, newValue, resultCount) {
    try {
      const categoryName = this._getCategoryDisplayName(
        this.currentCategoryFilter
      );
      const statusName = this._getStatusDisplayName(this.currentStatusFilter);

      let announcement = '';

      if (filterType === 'category') {
        announcement = `Category filter changed to ${this._getCategoryDisplayName(newValue)}. `;
      } else if (filterType === 'status') {
        announcement = `Status filter changed to ${this._getStatusDisplayName(newValue)}. `;
      }

      // Add current filter state
      announcement += `Current filters: ${categoryName} and ${statusName}. `;

      // Add result count
      if (resultCount === 0) {
        announcement += 'No quizzes match these filters.';
      } else if (resultCount === 1) {
        announcement += '1 quiz matches these filters.';
      } else {
        announcement += `${resultCount} quizzes match these filters.`;
      }

      accessibilityHelper.announce(announcement);
    } catch (error) {
      console.error('Error announcing filter change:', error);
    }
  }

  /**
   * Reset status filter with fallback while preserving category filter
   * @private
   */
  _resetStatusFilterWithFallback(container) {
    try {
      // Reset to "all" status while preserving category filter
      const preservedCategoryFilter = this.currentCategoryFilter;
      this.currentStatusFilter = 'all';

      this._updateStatusFilterVisualState('all', container);
      this._refreshQuizGrid(container);

      // Ensure category filter is preserved
      this.currentCategoryFilter = preservedCategoryFilter;

      console.log('Status filter reset to "all", category filter preserved:', {
        statusFilter: this.currentStatusFilter,
        categoryFilter: this.currentCategoryFilter,
      });
    } catch (error) {
      console.error('Failed to reset status filter:', error);
      throw error;
    }
  }
}

export default IHKQuizListView;
