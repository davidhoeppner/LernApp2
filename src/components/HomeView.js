import { formatTime } from '../utils/formatUtils.js';

/**
 * HomeView - Landing page with overview and quick actions
 */
class HomeView {
  constructor(services) {
    this.progressService = services.progressService;
    this.moduleService = services.moduleService;
    this.stateManager = services.stateManager;
    this.router = services.router;
  }

  /**
   * Render home view
   */
  async render() {
    const container = document.createElement('main');
  container.className = 'home-view';
    container.setAttribute('role', 'main');
    container.setAttribute('aria-label', 'Home page');

    try {
      // Get progress data (now async)
      const progress = await this.progressService.getOverallProgress();
      const modules = await this.moduleService.getModules();
      const recentActivity = this._getRecentActivity();

      container.innerHTML = `
        ${this._renderHero(progress)}
        ${this._renderQuickStats(progress, modules)}
        ${this._renderQuickActions()}
        ${this._renderRecentActivity(recentActivity)}
      `;

      this._attachEventListeners(container);
    } catch (error) {
      console.error('Error rendering home view:', error);
      container.innerHTML = this._renderError();
    }

    return container;
  }

  /**
   * Render hero section
   */
  _renderHero(progress) {
    const greeting = this._getGreeting();
    const percentage = progress.overallPercentage || 0;

    return `
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-content">
          <h1 id="hero-title" class="hero-title">${greeting}</h1>
          <p class="hero-subtitle">Continue your learning journey</p>
          <div class="hero-progress" role="region" aria-label="Overall progress indicator">
            <div class="progress-info">
              <span class="progress-label">Overall Progress</span>
              <span class="progress-percentage" aria-label="${percentage} percent complete">${percentage}%</span>
            </div>
            <div class="progress-bar" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="Overall progress">
              <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Render quick stats cards
   */
  _renderQuickStats(progress, modules) {
    const completedModules = progress.modulesCompleted || 0;
    const totalModules = progress.totalModules || 0;
    const totalQuizzes = progress.totalQuizzes || 0;
    const quizzesTaken = progress.quizzesTaken || 0;
    const averageScore = progress.averageQuizScore || 0;
    const inProgressCount = modules.filter(m => m.inProgress).length;

    return `
      <section class="quick-stats" aria-labelledby="stats-heading">
        <h2 id="stats-heading" class="sr-only">Learning Statistics</h2>
        <div class="stats-grid" role="list">
          <div class="stat-card" role="listitem">
            <div class="stat-icon" aria-hidden="true">📚</div>
            <div class="stat-content">
              <div class="stat-value" aria-label="${completedModules} of ${totalModules} modules completed">${completedModules}/${totalModules}</div>
              <div class="stat-label">Modules Completed</div>
            </div>
          </div>

          <div class="stat-card" role="listitem">
            <div class="stat-icon" aria-hidden="true">📝</div>
            <div class="stat-content">
              <div class="stat-value" aria-label="${quizzesTaken} of ${totalQuizzes} quizzes taken">${quizzesTaken}/${totalQuizzes}</div>
              <div class="stat-label">Quizzes Taken</div>
            </div>
          </div>

          <div class="stat-card" role="listitem">
            <div class="stat-icon" aria-hidden="true">⭐</div>
            <div class="stat-content">
              <div class="stat-value" aria-label="Average score ${averageScore} percent">${averageScore}%</div>
              <div class="stat-label">Average Score</div>
            </div>
          </div>

          <div class="stat-card" role="listitem">
            <div class="stat-icon" aria-hidden="true">🎯</div>
            <div class="stat-content">
              <div class="stat-value" aria-label="${inProgressCount} modules in progress">${inProgressCount}</div>
              <div class="stat-label">In Progress</div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Render quick action buttons
   */
  _renderQuickActions() {
    return `
      <section class="quick-actions" aria-labelledby="actions-heading">
        <h2 id="actions-heading" class="section-title">Quick Actions</h2>
        <div class="actions-grid" role="group" aria-label="Quick action buttons">
          <button class="action-card" data-action="start-learning" aria-label="Start learning - Browse and study modules">
            <div class="action-icon" aria-hidden="true">📖</div>
            <div class="action-content">
              <h3 class="action-title">Start Learning</h3>
              <p class="action-description">Browse and study modules</p>
            </div>
          </button>

          <button class="action-card" data-action="take-quiz" aria-label="Take quiz - Test your knowledge">
            <div class="action-icon" aria-hidden="true">✏️</div>
            <div class="action-content">
              <h3 class="action-title">Take Quiz</h3>
              <p class="action-description">Test your knowledge</p>
            </div>
          </button>

          <button class="action-card" data-action="view-progress" aria-label="View progress - Track your achievements">
            <div class="action-icon" aria-hidden="true">📊</div>
            <div class="action-content">
              <h3 class="action-title">View Progress</h3>
              <p class="action-description">Track your achievements</p>
            </div>
          </button>
        </div>
      </section>
    `;
  }

  /**
   * Render recent activity list
   */
  _renderRecentActivity(activities) {
    if (!activities || activities.length === 0) {
      return `
        <section class="recent-activity" aria-labelledby="activity-heading">
          <h2 id="activity-heading" class="section-title">Recent Activity</h2>
          <div class="empty-state" role="status">
            <p>No recent activity yet. Start learning to see your progress here!</p>
          </div>
        </section>
      `;
    }

    const activityItems = activities
      .map(
        activity => `
        <div class="activity-item" role="listitem">
          <div class="activity-icon" aria-hidden="true">${activity.icon}</div>
          <div class="activity-content">
            <div class="activity-title">${activity.title}</div>
            <div class="activity-time">${activity.time}</div>
          </div>
        </div>
      `
      )
      .join('');

    return `
      <section class="recent-activity" aria-labelledby="activity-heading">
        <h2 id="activity-heading" class="section-title">Recent Activity</h2>
        <div class="activity-list" role="list" aria-label="Recent learning activities">
          ${activityItems}
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
        <h2>Unable to load dashboard</h2>
        <p>Please try refreshing the page.</p>
        <button class="btn-primary" onclick="window.location.reload()">Refresh</button>
      </div>
    `;
  }

  /**
   * Get greeting based on time of day
   */
  _getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! 🌅';
    if (hour < 18) return 'Good Afternoon! ☀️';
    return 'Good Evening! 🌙';
  }

  /**
   * Get recent activity from state
   */
  _getRecentActivity() {
    const progress = this.stateManager.getState('progress') || {};
    const activities = [];

    // Get completed modules
    const modulesCompleted = progress.modulesCompleted || [];
    const modules = this.stateManager.getState('modules') || [];

    modulesCompleted.slice(-3).forEach(moduleId => {
      const module = modules.find(m => m.id === moduleId);
      if (module) {
        activities.push({
          icon: '✅',
          title: `Completed: ${module.title}`,
          time: formatTime(progress.lastActivity),
        });
      }
    });

    // Get recent quiz attempts
    const quizAttempts = progress.quizAttempts || [];
    quizAttempts.slice(-3).forEach(attempt => {
      activities.push({
        icon: attempt.score >= 70 ? '🎉' : '📝',
        title: `Quiz completed with ${attempt.score}%`,
        time: formatTime(attempt.date),
      });
    });

    // Sort by time and limit to 5
    return activities.slice(0, 5);
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners(container) {
    // Quick action buttons
    const startLearning = container.querySelector(
      '[data-action="start-learning"]'
    );
    const takeQuiz = container.querySelector('[data-action="take-quiz"]');
    const viewProgress = container.querySelector(
      '[data-action="view-progress"]'
    );

    if (startLearning) {
      startLearning.addEventListener('click', () => {
        window.location.hash = '#/modules';
      });
    }

    if (takeQuiz) {
      takeQuiz.addEventListener('click', () => {
        window.location.hash = '#/quizzes';
      });
    }

    if (viewProgress) {
      viewProgress.addEventListener('click', () => {
        window.location.hash = '#/progress';
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

export default HomeView;
