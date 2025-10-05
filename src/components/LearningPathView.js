import LoadingSpinner from './LoadingSpinner.js';
import EmptyState from './EmptyState.js';
import toastNotification from './ToastNotification.js';

/**
 * LearningPathView - Display structured learning path with progress tracking
 */
class LearningPathView {
  constructor(services) {
    this.ihkContentService = services.ihkContentService;
    this.progressService = services.progressService;
    this.router = services.router;
    this.learningPath = null;
    this.modules = [];
    this.quizzes = [];
    this.userProgress = {};
  }

  /**
   * Render learning path view
   */
  async render(pathId) {
    const container = document.createElement('main');
    container.className = 'learning-path-view';
    container.id = 'main-content';
    container.setAttribute('role', 'main');
    container.setAttribute('aria-label', 'Learning path page');

    // Show loading state
    const loadingSpinner = LoadingSpinner.create({
      message: 'Loading learning path...',
      size: 'medium',
    });
    container.appendChild(loadingSpinner);

    try {
      // Load learning path data
      this.learningPath = await this.ihkContentService.getLearningPath(pathId);

      // Load modules and quizzes
      await this._loadPathContent();

      // Load user progress
      this._loadUserProgress();

      // Remove loading spinner
      loadingSpinner.remove();

      container.innerHTML = `
        ${this._renderPathHeader()}
        ${this._renderProgressOverview()}
        ${this._renderModulesList()}
        ${this._renderQuizzesList()}
        ${this._renderMilestones()}
      `;

      this._attachEventListeners(container);
    } catch (error) {
      console.error('Error rendering learning path:', error);
      toastNotification.error(
        'Failed to load learning path. Please try again.'
      );

      loadingSpinner.remove();
      const errorState = EmptyState.error(
        'Unable to load learning path. Please try again.'
      );
      container.appendChild(errorState);
    }

    return container;
  }

  /**
   * Load path content (modules and quizzes)
   */
  async _loadPathContent() {
    // Load modules
    const modulePromises = this.learningPath.modules.map(async item => {
      const module = await this.ihkContentService.getModuleById(item.moduleId);
      return { ...module, order: item.order, required: item.required };
    });
    this.modules = await Promise.all(modulePromises);
    this.modules.sort((a, b) => a.order - b.order);

    // Load quizzes
    if (this.learningPath.quizzes && this.learningPath.quizzes.length > 0) {
      const quizPromises = this.learningPath.quizzes.map(async item => {
        const quiz = await this.ihkContentService.getQuizById(item.quizId);
        return {
          ...quiz,
          order: item.order,
          unlockAfterModules: item.unlockAfterModules,
        };
      });
      this.quizzes = await Promise.all(quizPromises);
      this.quizzes.sort((a, b) => a.order - b.order);
    }
  }

  /**
   * Load user progress
   */
  _loadUserProgress() {
    const progress = this.progressService.getProgress();
    this.userProgress = {
      completedModules: progress.modulesCompleted || [],
      completedQuizzes:
        progress.quizAttempts?.filter(q => q.passed).map(q => q.quizId) || [],
    };
  }

  /**
   * Render path header
   */
  _renderPathHeader() {
    const difficultyLabels = {
      beginner: 'Grundlagen',
      intermediate: 'Fortgeschritten',
      advanced: 'Experte',
    };

    return `
      <div class="path-header">
        <div class="path-header-content">
          <h1 class="path-title">${this.learningPath.title}</h1>
          <p class="path-description">${this.learningPath.description}</p>
          <div class="path-meta">
            <span class="meta-item">
              <span class="meta-icon" aria-hidden="true">📊</span>
              <span>${difficultyLabels[this.learningPath.difficulty]}</span>
            </span>
            <span class="meta-item">
              <span class="meta-icon" aria-hidden="true">⏱️</span>
              <span>ca. ${this.learningPath.estimatedDuration} Stunden</span>
            </span>
            <span class="meta-item">
              <span class="meta-icon" aria-hidden="true">📚</span>
              <span>${this.modules.length} Module</span>
            </span>
            ${
              this.quizzes.length > 0
                ? `
              <span class="meta-item">
                <span class="meta-icon" aria-hidden="true">✅</span>
                <span>${this.quizzes.length} Quiz${this.quizzes.length > 1 ? 'ze' : ''}</span>
              </span>
            `
                : ''
            }
          </div>
          ${
            this.learningPath.tags && this.learningPath.tags.length > 0
              ? `
            <div class="path-tags">
              ${this.learningPath.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  /**
   * Render progress overview
   */
  _renderProgressOverview() {
    const totalItems = this.modules.length + this.quizzes.length;
    const completedItems =
      this.modules.filter(m =>
        this.userProgress.completedModules.includes(m.id)
      ).length +
      this.quizzes.filter(q =>
        this.userProgress.completedQuizzes.includes(q.id)
      ).length;

    const progressPercentage =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return `
      <div class="progress-overview">
        <div class="progress-header">
          <h2 class="progress-title">Dein Fortschritt</h2>
          <span class="progress-percentage">${progressPercentage}%</span>
        </div>
        <div class="progress-bar" role="progressbar" aria-valuenow="${progressPercentage}" aria-valuemin="0" aria-valuemax="100" aria-label="Learning path progress: ${progressPercentage} percent">
          <div class="progress-fill" style="width: ${progressPercentage}%"></div>
        </div>
        <div class="progress-stats">
          <div class="stat">
            <span class="stat-value">${completedItems}</span>
            <span class="stat-label">von ${totalItems} abgeschlossen</span>
          </div>
          <div class="stat">
            <span class="stat-value">${this._calculateCompletedMilestones()}</span>
            <span class="stat-label">von ${this.learningPath.milestones.length} Meilensteinen</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render modules list
   */
  _renderModulesList() {
    return `
      <section class="path-section modules-section">
        <h2 class="section-title">
          <span class="section-icon" aria-hidden="true">📚</span>
          Lernmodule
        </h2>
        <div class="modules-list" role="list">
          ${this.modules.map((module, index) => this._renderModuleItem(module, index)).join('')}
        </div>
      </section>
    `;
  }

  /**
   * Render individual module item
   */
  _renderModuleItem(module, index) {
    const isCompleted = this.userProgress.completedModules.includes(module.id);
    const isUnlocked = this._isModuleUnlocked(module, index);
    const statusClass = isCompleted
      ? 'completed'
      : isUnlocked
        ? 'unlocked'
        : 'locked';

    return `
      <article class="path-item module-item ${statusClass}" role="listitem" data-module-id="${module.id}">
        <div class="item-number">
          ${isCompleted ? '✓' : index + 1}
        </div>
        <div class="item-content">
          <div class="item-header">
            <h3 class="item-title">${module.title}</h3>
            <div class="item-badges">
              ${module.required ? '<span class="badge badge-error">Pflicht</span>' : '<span class="badge badge-default">Optional</span>'}
              ${isCompleted ? '<span class="badge badge-success">Abgeschlossen</span>' : ''}
              ${!isUnlocked ? '<span class="badge badge-default">🔒 Gesperrt</span>' : ''}
            </div>
          </div>
          <p class="item-description">${module.description}</p>
          ${
            module.estimatedTime
              ? `
            <div class="item-meta">
              <span class="meta-icon" aria-hidden="true">⏱️</span>
              <span>ca. ${module.estimatedTime} Minuten</span>
            </div>
          `
              : ''
          }
        </div>
        <div class="item-actions">
          ${
            isUnlocked
              ? `
            <button class="btn-primary btn-sm start-module-btn" data-module-id="${module.id}">
              ${isCompleted ? 'Wiederholen' : 'Starten'}
            </button>
          `
              : `
            <button class="btn-ghost btn-sm" disabled>
              Gesperrt
            </button>
          `
          }
        </div>
      </article>
    `;
  }

  /**
   * Render quizzes list
   */
  _renderQuizzesList() {
    if (this.quizzes.length === 0) {
      return '';
    }

    return `
      <section class="path-section quizzes-section">
        <h2 class="section-title">
          <span class="section-icon" aria-hidden="true">✅</span>
          Wissenstests
        </h2>
        <div class="quizzes-list" role="list">
          ${this.quizzes.map(quiz => this._renderQuizItem(quiz)).join('')}
        </div>
      </section>
    `;
  }

  /**
   * Render individual quiz item
   */
  _renderQuizItem(quiz) {
    const isCompleted = this.userProgress.completedQuizzes.includes(quiz.id);
    const isUnlocked = this._isQuizUnlocked(quiz);
    const statusClass = isCompleted
      ? 'completed'
      : isUnlocked
        ? 'unlocked'
        : 'locked';

    return `
      <article class="path-item quiz-item ${statusClass}" role="listitem" data-quiz-id="${quiz.id}">
        <div class="item-number">
          ${isCompleted ? '✓' : '?'}
        </div>
        <div class="item-content">
          <div class="item-header">
            <h3 class="item-title">${quiz.title}</h3>
            <div class="item-badges">
              ${isCompleted ? '<span class="badge badge-success">Bestanden</span>' : ''}
              ${!isUnlocked ? '<span class="badge badge-default">🔒 Gesperrt</span>' : ''}
            </div>
          </div>
          <p class="item-description">${quiz.description}</p>
          ${
            quiz.questions
              ? `
            <div class="item-meta">
              <span class="meta-icon" aria-hidden="true">❓</span>
              <span>${quiz.questions.length} Fragen</span>
            </div>
          `
              : ''
          }
        </div>
        <div class="item-actions">
          ${
            isUnlocked
              ? `
            <button class="btn-primary btn-sm start-quiz-btn" data-quiz-id="${quiz.id}">
              ${isCompleted ? 'Erneut versuchen' : 'Quiz starten'}
            </button>
          `
              : `
            <button class="btn-ghost btn-sm" disabled>
              Gesperrt
            </button>
          `
          }
        </div>
      </article>
    `;
  }

  /**
   * Render milestones
   */
  _renderMilestones() {
    return `
      <section class="path-section milestones-section">
        <h2 class="section-title">
          <span class="section-icon" aria-hidden="true">🏆</span>
          Meilensteine
        </h2>
        <div class="milestones-list">
          ${this.learningPath.milestones.map((milestone, index) => this._renderMilestone(milestone, index)).join('')}
        </div>
      </section>
    `;
  }

  /**
   * Render individual milestone
   */
  _renderMilestone(milestone, _index) {
    const isAchieved = this._isMilestoneAchieved(milestone);
    const statusClass = isAchieved ? 'achieved' : 'pending';

    return `
      <div class="milestone ${statusClass}">
        <div class="milestone-icon">
          ${isAchieved ? '🏆' : '⭕'}
        </div>
        <div class="milestone-content">
          <h3 class="milestone-title">${milestone.title}</h3>
          <p class="milestone-description">${milestone.description}</p>
          ${
            !isAchieved
              ? `
            <div class="milestone-requirements">
              <span class="requirements-label">Noch benötigt:</span>
              ${this._renderMilestoneRequirements(milestone)}
            </div>
          `
              : `
            <span class="badge badge-success">Erreicht!</span>
          `
          }
        </div>
      </div>
    `;
  }

  /**
   * Render milestone requirements
   */
  _renderMilestoneRequirements(milestone) {
    const missingModules = milestone.requiredModules.filter(
      id => !this.userProgress.completedModules.includes(id)
    );
    const missingQuizzes = milestone.requiredQuizzes.filter(
      id => !this.userProgress.completedQuizzes.includes(id)
    );

    const requirements = [];
    if (missingModules.length > 0) {
      requirements.push(
        `${missingModules.length} Modul${missingModules.length > 1 ? 'e' : ''}`
      );
    }
    if (missingQuizzes.length > 0) {
      requirements.push(
        `${missingQuizzes.length} Quiz${missingQuizzes.length > 1 ? 'ze' : ''}`
      );
    }

    return requirements.join(', ');
  }

  /**
   * Check if module is unlocked
   */
  _isModuleUnlocked(module, index) {
    // First module is always unlocked
    if (index === 0) return true;

    // Check if previous module is completed
    const previousModule = this.modules[index - 1];
    return this.userProgress.completedModules.includes(previousModule.id);
  }

  /**
   * Check if quiz is unlocked
   */
  _isQuizUnlocked(quiz) {
    if (!quiz.unlockAfterModules || quiz.unlockAfterModules.length === 0) {
      return true;
    }

    return quiz.unlockAfterModules.every(moduleId =>
      this.userProgress.completedModules.includes(moduleId)
    );
  }

  /**
   * Check if milestone is achieved
   */
  _isMilestoneAchieved(milestone) {
    const modulesCompleted = milestone.requiredModules.every(id =>
      this.userProgress.completedModules.includes(id)
    );
    const quizzesCompleted = milestone.requiredQuizzes.every(id =>
      this.userProgress.completedQuizzes.includes(id)
    );

    return modulesCompleted && quizzesCompleted;
  }

  /**
   * Calculate completed milestones
   */
  _calculateCompletedMilestones() {
    return this.learningPath.milestones.filter(m =>
      this._isMilestoneAchieved(m)
    ).length;
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners(container) {
    // Start module buttons
    const moduleButtons = container.querySelectorAll('.start-module-btn');
    moduleButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const moduleId = e.currentTarget.dataset.moduleId;
        window.location.hash = `#/ihk/module/${moduleId}`;
      });
    });

    // Start quiz buttons
    const quizButtons = container.querySelectorAll('.start-quiz-btn');
    quizButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const quizId = e.currentTarget.dataset.quizId;
        window.location.hash = `#/ihk/quiz/${quizId}`;
      });
    });
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Cleanup if needed
  }
}

export default LearningPathView;
