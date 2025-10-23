import EmptyState from './EmptyState.js';
import LoadingSpinner from './LoadingSpinner.js';
import toastNotification from './ToastNotification.js';
import { formatDate } from '../utils/formatUtils.js';

/**
 * ProgressView - Comprehensive progress dashboard with specialization support
 */
class ProgressView {
  constructor(services) {
    this.progressService = services.progressService;
    this.moduleService = services.moduleService;
    this.quizService = services.quizService;
    this.ihkContentService = services.ihkContentService;
    this.stateManager = services.stateManager;
    this.specializationService = services.specializationService;
  }

  /**
   * Render progress view with specialization support
   */
  async render() {
    const container = document.createElement('main');
  container.className = 'progress-view';
    container.setAttribute('role', 'main');
    container.setAttribute('aria-label', 'Progress tracking page');

    try {
      const currentSpecialization = this.specializationService
        ? this.specializationService.getCurrentSpecialization()
        : null;

      const overallProgress = await this.progressService.getOverallProgress();
      const modules = await this.moduleService.getModules();
      const quizHistory = this.progressService.getQuizHistory();
      const quizzes = await this.ihkContentService.getAllQuizzes();

      // Get specialization-specific data if available
      let specializationStats = null;
      let categoryBreakdown = null;

      if (currentSpecialization && this.specializationService) {
        try {
          specializationStats =
            await this.progressService.getSpecializationStatistics(
              currentSpecialization
            );
          categoryBreakdown = overallProgress.categoryBreakdown || {};
        } catch (error) {
          console.warn('Could not load specialization statistics:', error);
        }
      }

      container.innerHTML = `
        <header class="progress-header">
          <h1 class="page-title">Your Progress</h1>
          <p class="page-description">Track your learning journey and achievements</p>
          ${currentSpecialization ? this._renderSpecializationHeader(currentSpecialization) : ''}
        </header>

        ${this._renderOverallProgress(overallProgress, specializationStats)}
        ${categoryBreakdown ? this._renderCategoryBreakdown(categoryBreakdown, currentSpecialization) : ''}
        ${this._renderModuleCompletion(modules, currentSpecialization)}
        ${this._renderQuizHistory(quizHistory, quizzes)}
        ${this._renderExportSection()}
      `;

      this._attachEventListeners(container);
    } catch (error) {
      console.error('Error rendering progress view:', error);
      container.innerHTML = this._renderError();
    }

    return container;
  }

  /**
   * Render specialization header
   */
  _renderSpecializationHeader(specializationId) {
    if (!this.specializationService) return '';

    const config =
      this.specializationService.getSpecializationConfig(specializationId);
    if (!config) return '';

    return `
      <div class="specialization-header">
        <div class="specialization-badge" style="background-color: ${config.color}20; border-color: ${config.color}">
          <span class="specialization-icon">${config.icon}</span>
          <span class="specialization-name">${config.name}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render overall progress card with specialization support
   */
  _renderOverallProgress(progress, specializationStats) {
    const percentage = progress.overallPercentage || 0;
    const lastActivity = progress.lastActivity
      ? formatDate(progress.lastActivity)
      : 'No activity yet';

    const specializationInfo = specializationStats
      ? `
      <div class="specialization-progress-info">
        <h3 class="specialization-progress-title">Specialization Progress</h3>
        <div class="specialization-stats">
          ${
            specializationStats.strengths.length > 0
              ? `
            <div class="stat-item strengths">
              <span class="stat-icon">💪</span>
              <div class="stat-content">
                <div class="stat-label">Strengths</div>
                <div class="stat-value">${specializationStats.strengths.join(', ')}</div>
              </div>
            </div>
          `
              : ''
          }
          ${
            specializationStats.improvementAreas.length > 0
              ? `
            <div class="stat-item improvements">
              <span class="stat-icon">📈</span>
              <div class="stat-content">
                <div class="stat-label">Areas for Improvement</div>
                <div class="stat-value">${specializationStats.improvementAreas.join(', ')}</div>
              </div>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `
      : '';

    return `
      <section class="overall-progress-section">
        <div class="progress-card">
          <h2 class="card-title">Overall Progress</h2>

          <div class="progress-circle-container">
            <svg class="progress-circle" viewBox="0 0 200 200">
              <circle
                class="progress-circle-bg"
                cx="100"
                cy="100"
                r="90"
              />
              <circle
                class="progress-circle-fill"
                cx="100"
                cy="100"
                r="90"
                stroke-dasharray="${(percentage / 100) * 565.48} 565.48"
              />
            </svg>
            <div class="progress-circle-text">
              <div class="progress-percentage">${percentage}%</div>
              <div class="progress-label">Complete</div>
            </div>
          </div>

          <div class="progress-summary">
            <div class="summary-item">
              <span class="summary-icon">📚</span>
              <div class="summary-content">
                <div class="summary-value">${progress.modulesCompleted}/${progress.totalModules}</div>
                <div class="summary-label">Modules Completed</div>
              </div>
            </div>

            <div class="summary-item">
              <span class="summary-icon">📝</span>
              <div class="summary-content">
                <div class="summary-value">${progress.quizzesTaken}</div>
                <div class="summary-label">Quizzes Taken</div>
              </div>
            </div>

            <div class="summary-item">
              <span class="summary-icon">⭐</span>
              <div class="summary-content">
                <div class="summary-value">${progress.averageQuizScore}%</div>
                <div class="summary-label">Average Score</div>
              </div>
            </div>

            <div class="summary-item">
              <span class="summary-icon">🕒</span>
              <div class="summary-content">
                <div class="summary-value">${lastActivity}</div>
                <div class="summary-label">Last Activity</div>
              </div>
            </div>
          </div>

          ${specializationInfo}
        </div>
      </section>
    `;
  }

  /**
   * Render category breakdown section
   */
  _renderCategoryBreakdown(categoryBreakdown, specializationId) {
    if (!categoryBreakdown || Object.keys(categoryBreakdown).length === 0) {
      return '';
    }

    const categories = Object.entries(categoryBreakdown)
      .map(([categoryId, data]) => {
        const completionRate =
          data.modulesCompleted > 0
            ? Math.round(
                (data.modulesCompleted /
                  Math.max(data.modulesCompleted + 1, 1)) *
                  100
              )
            : 0;

        const relevanceColor = this._getRelevanceColor(data.relevance);

        return `
        <div class="category-item">
          <div class="category-header">
            <div class="category-info">
              <h4 class="category-name">${data.name}</h4>
              <span class="category-relevance" style="background-color: ${relevanceColor}20; color: ${relevanceColor}">
                ${data.relevance}
              </span>
            </div>
            <div class="category-completion">${completionRate}%</div>
          </div>
          
          <div class="category-progress-bar">
            <div class="progress-bar-fill" style="width: ${completionRate}%; background-color: ${relevanceColor}"></div>
          </div>
          
          <div class="category-stats">
            <div class="category-stat">
              <span class="stat-icon">📚</span>
              <span class="stat-text">${data.modulesCompleted} modules</span>
            </div>
            <div class="category-stat">
              <span class="stat-icon">📝</span>
              <span class="stat-text">${data.quizzesTaken} quizzes</span>
            </div>
            ${
              data.averageQuizScore > 0
                ? `
              <div class="category-stat">
                <span class="stat-icon">⭐</span>
                <span class="stat-text">${data.averageQuizScore}% avg</span>
              </div>
            `
                : ''
            }
          </div>
        </div>
      `;
      })
      .join('');

    return `
      <section class="category-breakdown-section">
        <h2 class="section-title">Progress by Category</h2>
        <div class="category-grid">
          ${categories}
        </div>
      </section>
    `;
  }

  /**
   * Get color for relevance level
   */
  _getRelevanceColor(relevance) {
    const colors = {
      high: '#10b981',
      medium: '#f59e0b',
      low: '#6b7280',
      none: '#9ca3af',
    };
    return colors[relevance] || colors.none;
  }

  /**
   * Render module completion list with categorization
   */
  _renderModuleCompletion(modules, specializationId) {
    const completedModules = modules.filter(m => m.completed);
    const inProgressModules = modules.filter(m => m.inProgress && !m.completed);
    const notStartedModules = modules.filter(
      m => !m.completed && !m.inProgress
    );

    // Categorize modules if specialization service is available
    let categorizedModules = {};
    if (specializationId && this.specializationService) {
      categorizedModules = this._categorizeModules(modules, specializationId);
    }

    const categoryTabs =
      Object.keys(categorizedModules).length > 0
        ? `
      <div class="category-filter-tabs">
        <button class="category-tab active" data-category="all">
          All Categories
        </button>
        ${Object.entries(categorizedModules)
          .map(
            ([categoryId, categoryModules]) => `
          <button class="category-tab" data-category="${categoryId}">
            ${this._getCategoryDisplayName(categoryId)} (${categoryModules.length})
          </button>
        `
          )
          .join('')}
      </div>
    `
        : '';

    return `
      <section class="module-completion-section">
        <h2 class="section-title">Module Progress</h2>

        ${categoryTabs}

        <div class="module-status-tabs">
          <button class="status-tab active" data-tab="all">
            All (${modules.length})
          </button>
          <button class="status-tab" data-tab="completed">
            Completed (${completedModules.length})
          </button>
          <button class="status-tab" data-tab="in-progress">
            In Progress (${inProgressModules.length})
          </button>
          <button class="status-tab" data-tab="not-started">
            Not Started (${notStartedModules.length})
          </button>
        </div>

        <div class="module-list" data-tab-content="all">
          ${this._renderModuleList(modules, specializationId)}
        </div>

        <div class="module-list hidden" data-tab-content="completed">
          ${this._renderModuleList(completedModules, specializationId)}
        </div>

        <div class="module-list hidden" data-tab-content="in-progress">
          ${this._renderModuleList(inProgressModules, specializationId)}
        </div>

        <div class="module-list hidden" data-tab-content="not-started">
          ${this._renderModuleList(notStartedModules, specializationId)}
        </div>

        ${Object.entries(categorizedModules)
          .map(
            ([categoryId, categoryModules]) => `
          <div class="module-list hidden" data-category-content="${categoryId}">
            ${this._renderModuleList(categoryModules, specializationId)}
          </div>
        `
          )
          .join('')}
      </section>
    `;
  }

  /**
   * Categorize modules by specialization relevance
   */
  _categorizeModules(modules, specializationId) {
    if (!this.specializationService) return {};

    const categories = {};

    modules.forEach(module => {
      const categoryId = this._getModuleCategoryId(module);
      const relevance = this.specializationService.getCategoryRelevance(
        categoryId,
        specializationId
      );

      let categoryKey = 'general';
      if (relevance === 'high' && categoryId.includes('BP-AE')) {
        categoryKey = 'anwendungsentwicklung';
      } else if (relevance === 'high' && categoryId.includes('BP-DPA')) {
        categoryKey = 'daten-prozessanalyse';
      }

      if (!categories[categoryKey]) {
        categories[categoryKey] = [];
      }
      categories[categoryKey].push(module);
    });

    return categories;
  }

  /**
   * Get module category ID
   */
  _getModuleCategoryId(module) {
    // Extract category from module ID or use category property
    if (module.category) return module.category;

    if (module.id.includes('bp-ae-')) return 'BP-AE';
    if (module.id.includes('bp-dpa-')) return 'BP-DPA';
    if (module.id.includes('fue-')) return 'FUE';

    return 'general';
  }

  /**
   * Get display name for category
   */
  _getCategoryDisplayName(categoryId) {
    const names = {
      general: 'General',
      anwendungsentwicklung: 'Anwendungsentwicklung',
      'daten-prozessanalyse': 'Daten- und Prozessanalyse',
    };
    return names[categoryId] || categoryId;
  }

  /**
   * Render module list with category indicators
   */
  _renderModuleList(modules, specializationId) {
    if (modules.length === 0) {
      return '<div class="empty-state"><p>No modules in this category.</p></div>';
    }

    return modules
      .map(module => {
        const categoryId = this._getModuleCategoryId(module);
        const relevance =
          specializationId && this.specializationService
            ? this.specializationService.getCategoryRelevance(
                categoryId,
                specializationId
              )
            : 'medium';
        const relevanceColor = this._getRelevanceColor(relevance);

        return `
            <div class="module-progress-item">
              <div class="module-info">
                <div class="module-header">
                  <h3 class="module-name">${module.title}</h3>
                  <div class="module-indicators">
                    <span class="module-category" style="background-color: ${relevanceColor}20; color: ${relevanceColor}">
                      ${this._getCategoryDisplayName(this._getModuleCategoryId(module))}
                    </span>
                    ${
                      relevance !== 'medium'
                        ? `
                      <span class="relevance-indicator" style="background-color: ${relevanceColor}20; color: ${relevanceColor}">
                        ${relevance}
                      </span>
                    `
                        : ''
                    }
                  </div>
                </div>
                ${module.description ? `<p class="module-description">${module.description}</p>` : ''}
              </div>
              <div class="module-status">
                ${this._getModuleStatusBadge(module)}
              </div>
            </div>
          `;
      })
      .join('');
  }

  /**
   * Get module status badge
   */
  _getModuleStatusBadge(module) {
    if (module.completed) {
      return '<span class="badge badge-success">✓ Completed</span>';
    }
    if (module.inProgress) {
      return '<span class="badge badge-warning">In Progress</span>';
    }
    return '<span class="badge badge-default">Not Started</span>';
  }

  /**
   * Render quiz history table
   */
  _renderQuizHistory(quizHistory, quizzes) {
    if (quizHistory.length === 0) {
      const emptyState = EmptyState.noQuizHistory();
      return `
        <section class="quiz-history-section">
          <h2 class="section-title">Quiz History</h2>
          ${emptyState.outerHTML}
        </section>
      `;
    }

    const historyRows = quizHistory
      .map(attempt => {
        const quiz = quizzes.find(q => q.id === attempt.quizId);
        const quizTitle = quiz ? quiz.title : 'Unknown Quiz';

        return `
          <tr>
            <td>${quizTitle}</td>
            <td>
              <span class="score-badge ${attempt.passed ? 'score-pass' : 'score-fail'}">
                ${attempt.score}%
              </span>
            </td>
            <td>${attempt.correctAnswers}/${attempt.totalQuestions}</td>
            <td>${formatDate(attempt.date)}</td>
            <td>
              <span class="badge ${attempt.passed ? 'badge-success' : 'badge-error'}">
                ${attempt.passed ? 'Passed' : 'Failed'}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    return `
      <section class="quiz-history-section">
        <h2 class="section-title">Quiz History</h2>
        <div class="table-container">
          <table class="quiz-history-table">
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Score</th>
                <th>Correct</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${historyRows}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  /**
   * Render export section
   */
  _renderExportSection() {
    return `
      <section class="export-section">
        <div class="export-card">
          <div class="export-content">
            <h3 class="export-title">Export Your Progress</h3>
            <p class="export-description">
              Download your learning progress as a JSON file for backup or analysis.
            </p>
          </div>
          <button class="btn-primary" data-action="export-progress">
            <span>📥</span>
            Export Progress
          </button>
        </div>
      </section>
    `;
  }

  /**
   * Render error state
   */
  _renderError() {
    return `
      <div class="error-state">
        <h2>Unable to load progress</h2>
        <p>Please try refreshing the page.</p>
        <button class="btn-primary" onclick="window.location.reload()">Refresh</button>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners(container) {
    // Status tabs
    const tabs = container.querySelectorAll('.status-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this._switchTab(tabName, container);
      });
    });

    // Category tabs
    const categoryTabs = container.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const categoryName = tab.dataset.category;
        this._switchCategoryTab(categoryName, container);
      });
    });

    // Export progress button
    const exportBtn = container.querySelector(
      '[data-action="export-progress"]'
    );
    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        try {
          LoadingSpinner.setButtonLoading(exportBtn, true);

          // Add small delay to show loading state
          await new Promise(resolve => setTimeout(resolve, 300));

          await this.progressService.exportProgress();

          LoadingSpinner.setButtonLoading(exportBtn, false);
          toastNotification.success('Progress exported successfully!');
        } catch (error) {
          console.error('Error exporting progress:', error);
          LoadingSpinner.setButtonLoading(exportBtn, false);
          toastNotification.error(
            'Failed to export progress. Please try again.'
          );
        }
      });
    }
  }

  /**
   * Switch status tab
   */
  _switchTab(tabName, container) {
    // Update active tab
    const tabs = container.querySelectorAll('.status-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Show corresponding content
    const contents = container.querySelectorAll('[data-tab-content]');
    contents.forEach(content => {
      if (content.dataset.tabContent === tabName) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    });

    // Hide category content when switching status tabs
    const categoryContents = container.querySelectorAll(
      '[data-category-content]'
    );
    categoryContents.forEach(content => {
      content.classList.add('hidden');
    });
  }

  /**
   * Switch category tab
   */
  _switchCategoryTab(categoryName, container) {
    // Update active category tab
    const categoryTabs = container.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
      if (tab.dataset.category === categoryName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    if (categoryName === 'all') {
      // Show status-based content
      const activeStatusTab = container.querySelector('.status-tab.active');
      if (activeStatusTab) {
        this._switchTab(activeStatusTab.dataset.tab, container);
      }
    } else {
      // Hide status-based content
      const statusContents = container.querySelectorAll('[data-tab-content]');
      statusContents.forEach(content => {
        content.classList.add('hidden');
      });

      // Show category-specific content
      const categoryContents = container.querySelectorAll(
        '[data-category-content]'
      );
      categoryContents.forEach(content => {
        if (content.dataset.categoryContent === categoryName) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });
    }
  }

  /**
   * Show notification
   */
  _showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Cleanup if needed
  }
}

export default ProgressView;
