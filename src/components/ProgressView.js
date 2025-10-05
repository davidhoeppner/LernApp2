/* global setTimeout */
import EmptyState from './EmptyState.js';
import LoadingSpinner from './LoadingSpinner.js';
import toastNotification from './ToastNotification.js';

/**
 * ProgressView - Comprehensive progress dashboard
 */
class ProgressView {
  constructor(services) {
    this.progressService = services.progressService;
    this.moduleService = services.moduleService;
    this.quizService = services.quizService;
    this.stateManager = services.stateManager;
  }

  /**
   * Render progress view
   */
  async render() {
    const container = document.createElement('main');
    container.className = 'progress-view';
    container.id = 'main-content';
    container.setAttribute('role', 'main');
    container.setAttribute('aria-label', 'Progress tracking page');

    try {
      const overallProgress = this.progressService.getOverallProgress();
      const modules = await this.moduleService.getModules();
      const quizHistory = this.progressService.getQuizHistory();
      const quizzes = await this.quizService.getQuizzes();

      container.innerHTML = `
        <header class="progress-header">
          <h1 class="page-title">Your Progress</h1>
          <p class="page-description">Track your learning journey and achievements</p>
        </header>

        ${this._renderOverallProgress(overallProgress)}
        ${this._renderModuleCompletion(modules)}
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
   * Render overall progress card
   */
  _renderOverallProgress(progress) {
    const percentage = progress.overallPercentage || 0;
    const lastActivity = progress.lastActivity
      ? this._formatDate(progress.lastActivity)
      : 'No activity yet';

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
        </div>
      </section>
    `;
  }

  /**
   * Render module completion list
   */
  _renderModuleCompletion(modules) {
    const completedModules = modules.filter(m => m.completed);
    const inProgressModules = modules.filter(m => m.inProgress && !m.completed);
    const notStartedModules = modules.filter(
      m => !m.completed && !m.inProgress
    );

    return `
      <section class="module-completion-section">
        <h2 class="section-title">Module Progress</h2>

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
          ${this._renderModuleList(modules)}
        </div>

        <div class="module-list hidden" data-tab-content="completed">
          ${this._renderModuleList(completedModules)}
        </div>

        <div class="module-list hidden" data-tab-content="in-progress">
          ${this._renderModuleList(inProgressModules)}
        </div>

        <div class="module-list hidden" data-tab-content="not-started">
          ${this._renderModuleList(notStartedModules)}
        </div>
      </section>
    `;
  }

  /**
   * Render module list
   */
  _renderModuleList(modules) {
    if (modules.length === 0) {
      return '<div class="empty-state"><p>No modules in this category.</p></div>';
    }

    return modules
      .map(
        module => `
        <div class="module-progress-item">
          <div class="module-info">
            <h3 class="module-name">${module.title}</h3>
            <span class="module-category">${module.category || 'General'}</span>
          </div>
          <div class="module-status">
            ${this._getModuleStatusBadge(module)}
          </div>
        </div>
      `
      )
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
            <td>${this._formatDate(attempt.date)}</td>
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
   * Format date
   */
  _formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

          this.progressService.exportProgress();

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
   * Switch tab
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
