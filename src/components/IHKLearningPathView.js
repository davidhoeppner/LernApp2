/**
 * IHK Learning Path View Component
 * Displays structured learning paths with modules, quizzes, progress, and milestones
 */

import accessibilityHelper from '../utils/AccessibilityHelper.js';

import EmptyState from './EmptyState.js';
import LoadingSpinner from './LoadingSpinner.js';
import toastNotification from './ToastNotification.js';

class IHKLearningPathView {
  constructor(services) {
    this.services = services;
    this.ihkContentService = services.ihkContentService;
    this.examProgressService = services.examProgressService;
    this.router = services.router;
    this.learningPath = null;
    this.pathProgress = null;
  }

  /**
   * Render the learning path view
   */
  async render(pathId) {
    const container = document.createElement('div');
    container.className = 'ihk-learning-path-view';
    container.innerHTML = LoadingSpinner.render('Loading learning path...');

    // Load learning path asynchronously
    window.setTimeout(async () => {
      try {
        this.learningPath =
          await this.ihkContentService.getLearningPath(pathId);

        if (!this.learningPath) {
          const errorState = EmptyState.create({
            icon: '🎓',
            title: 'Learning Path Not Found',
            message: 'The requested learning path could not be found.',
            action: {
              label: 'Back to Overview',
              onClick: () => this.router.navigate('/'),
            },
          });
          container.innerHTML = '';
          container.appendChild(errorState);
          return;
        }

        this.pathProgress =
          this.examProgressService.getLearningPathProgress(pathId);
        container.innerHTML = '';
        container.appendChild(this.renderContent());
        accessibilityHelper.announce(
          `Learning path loaded: ${this.learningPath.title}`
        );
      } catch (error) {
        console.error('Error loading learning path:', error);
        const errorState = EmptyState.create({
          icon: '⚠️',
          title: 'Error Loading Learning Path',
          message: 'Failed to load learning path content. Please try again.',
          action: {
            label: 'Retry',
            onClick: () => this.render(pathId),
          },
        });
        container.innerHTML = '';
        container.appendChild(errorState);
        toastNotification.error('Failed to load learning path');
      }
    }, 0);

    return container;
  }

  /**
   * Render the main content
   */
  renderContent() {
    const content = document.createElement('div');
    content.className = 'ihk-learning-path-content';

    // Breadcrumb
    const breadcrumb = this.renderBreadcrumb();
    content.appendChild(breadcrumb);

    // Header
    const header = this.renderHeader();
    content.appendChild(header);

    // Progress overview
    const progress = this.renderProgressOverview();
    content.appendChild(progress);

    // Milestones
    if (
      this.learningPath.milestones &&
      this.learningPath.milestones.length > 0
    ) {
      const milestones = this.renderMilestones();
      content.appendChild(milestones);
    }

    // Learning path structure
    const structure = this.renderPathStructure();
    content.appendChild(structure);

    return content;
  }

  /**
   * Render breadcrumb navigation
   */
  renderBreadcrumb() {
    const nav = document.createElement('nav');
    nav.className = 'breadcrumb';
    nav.setAttribute('aria-label', 'Breadcrumb');

    nav.innerHTML = `
      <ol>
        <li><a href="#/">Home</a></li>
        <li><a href="#/">Lernpfade</a></li>
        <li><span aria-current="page">${this.learningPath.title}</span></li>
      </ol>
    `;

    return nav;
  }

  /**
   * Render header
   */
  renderHeader() {
    const header = document.createElement('header');
    header.className = 'learning-path-header';

    header.innerHTML = `
      <div class="path-icon-large">${this.getPathIcon(this.learningPath.id)}</div>
      <h1>${this.learningPath.title}</h1>
      <p class="path-description">${this.learningPath.description}</p>
      <div class="path-metadata">
        <span class="meta-item">
          <strong>Zielprüfung:</strong> ${this.learningPath.targetExam}
        </span>
        <span class="meta-item">
          <strong>Schwierigkeit:</strong> 
          <span class="difficulty difficulty-${this.learningPath.difficulty}">
            ${this.getDifficultyLabel(this.learningPath.difficulty)}
          </span>
        </span>
        <span class="meta-item">
          <strong>Geschätzte Dauer:</strong> ${this.learningPath.estimatedDuration}h
        </span>
        <span class="meta-item">
          <strong>Module:</strong> ${this.learningPath.modules.length}
        </span>
        <span class="meta-item">
          <strong>Quizzes:</strong> ${this.learningPath.quizzes.length}
        </span>
      </div>
    `;

    return header;
  }

  /**
   * Render progress overview
   */
  renderProgressOverview() {
    const section = document.createElement('section');
    section.className = 'progress-overview';
    section.setAttribute('aria-labelledby', 'progress-heading');

    const percentage = this.pathProgress?.percentage || 0;
    const completedModules = this.pathProgress?.completedModules || 0;
    const totalModules = this.learningPath.modules.length;
    const completedQuizzes = this.pathProgress?.completedQuizzes || 0;
    const totalQuizzes = this.learningPath.quizzes.length;

    section.innerHTML = `
      <h2 id="progress-heading">Dein Fortschritt</h2>
      <div class="progress-stats">
        <div class="progress-circle">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" class="progress-bg"></circle>
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              class="progress-bar"
              style="stroke-dasharray: ${percentage * 2.827}, 282.7"
            ></circle>
          </svg>
          <div class="progress-text">
            <span class="progress-percentage">${percentage}%</span>
            <span class="progress-label">Abgeschlossen</span>
          </div>
        </div>
        <div class="progress-details">
          <div class="progress-item">
            <span class="progress-icon">📚</span>
            <span class="progress-count">${completedModules} / ${totalModules}</span>
            <span class="progress-label">Module</span>
          </div>
          <div class="progress-item">
            <span class="progress-icon">📝</span>
            <span class="progress-count">${completedQuizzes} / ${totalQuizzes}</span>
            <span class="progress-label">Quizzes</span>
          </div>
        </div>
      </div>
    `;

    return section;
  }

  /**
   * Render milestones
   */
  renderMilestones() {
    const section = document.createElement('section');
    section.className = 'milestones';
    section.setAttribute('aria-labelledby', 'milestones-heading');

    section.innerHTML = `
      <h2 id="milestones-heading">Meilensteine</h2>
      <div class="milestones-list">
        ${this.learningPath.milestones
          .map((milestone, index) => {
            const isCompleted = this.isMilestoneCompleted(milestone);
            return `
            <div class="milestone-item ${isCompleted ? 'completed' : 'pending'}">
              <div class="milestone-icon">
                ${isCompleted ? '✓' : index + 1}
              </div>
              <div class="milestone-content">
                <h3>${milestone.title}</h3>
                <p>${milestone.description}</p>
                ${
                  !isCompleted
                    ? `
                  <div class="milestone-requirements">
                    <small>
                      Benötigt: ${milestone.requiredModules?.length || 0} Module, 
                      ${milestone.requiredQuizzes?.length || 0} Quizzes
                    </small>
                  </div>
                `
                    : ''
                }
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
    `;

    return section;
  }

  /**
   * Render learning path structure
   */
  renderPathStructure() {
    const section = document.createElement('section');
    section.className = 'path-structure';
    section.setAttribute('aria-labelledby', 'structure-heading');

    // Combine and sort modules and quizzes by order
    const items = [
      ...this.learningPath.modules.map(m => ({ ...m, type: 'module' })),
      ...this.learningPath.quizzes.map(q => ({ ...q, type: 'quiz' })),
    ].sort((a, b) => a.order - b.order);

    section.innerHTML = `
      <h2 id="structure-heading">Lernpfad-Struktur</h2>
      <div class="structure-list">
        ${items.map((item, index) => this.renderStructureItem(item, index)).join('')}
      </div>
    `;

    return section;
  }

  /**
   * Render a single structure item
   */
  renderStructureItem(item, index) {
    const isModule = item.type === 'module';
    const content = isModule
      ? this.ihkContentService.getModuleById(item.moduleId)
      : this.ihkContentService.getQuizById(item.quizId);

    if (!content) return '';

    const isCompleted = isModule
      ? this.examProgressService.isModuleCompleted(item.moduleId)
      : this.examProgressService.isQuizCompleted(item.quizId);

    const isLocked = this.isItemLocked(item);
    const icon = isModule ? '📚' : '📝';
    const url = isModule
      ? `#/modules/${item.moduleId}`
      : `#/quizzes/${item.quizId}`;

    return `
      <article class="structure-item ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}" role="article">
        <div class="item-number">${index + 1}</div>
        <div class="item-icon">${icon}</div>
        <div class="item-content">
          <h3>${content.title}</h3>
          <p class="item-description">${content.description}</p>
          <div class="item-meta">
            ${
              isModule
                ? `
              <span class="meta-tag">
                <span aria-hidden="true">⏱️</span>
                ${content.estimatedTime} Min.
              </span>
            `
                : `
              <span class="meta-tag">
                <span aria-hidden="true">❓</span>
                ${content.questions?.length || 0} Fragen
              </span>
            `
            }
            <span class="meta-tag difficulty-${content.difficulty}">
              ${this.getDifficultyLabel(content.difficulty)}
            </span>
            ${item.required ? '<span class="meta-tag required">Pflicht</span>' : ''}
          </div>
          ${
            isLocked && item.unlockAfterModules
              ? `
            <div class="item-locked-message">
              <span aria-hidden="true">🔒</span>
              Schließe zuerst die vorherigen Module ab
            </div>
          `
              : ''
          }
        </div>
        <div class="item-actions">
          ${
            isCompleted
              ? `
            <span class="completion-badge">✓ Abgeschlossen</span>
          `
              : ''
          }
          <button 
            class="btn ${isLocked ? 'btn-disabled' : 'btn-primary'}"
            ${isLocked ? 'disabled' : ''}
            onclick="window.location.hash = '${url}'"
            aria-label="${isLocked ? 'Locked' : 'Start'} ${content.title}"
          >
            ${isLocked ? 'Gesperrt' : isCompleted ? 'Wiederholen' : 'Starten'}
          </button>
        </div>
      </article>
    `;
  }

  /**
   * Check if item is locked
   */
  isItemLocked(item) {
    if (!item.unlockAfterModules || item.unlockAfterModules.length === 0) {
      return false;
    }

    // Check if all required modules are completed
    return !item.unlockAfterModules.every(moduleId =>
      this.examProgressService.isModuleCompleted(moduleId)
    );
  }

  /**
   * Check if milestone is completed
   */
  isMilestoneCompleted(milestone) {
    const modulesCompleted =
      milestone.requiredModules?.every(moduleId =>
        this.examProgressService.isModuleCompleted(moduleId)
      ) ?? true;

    const quizzesCompleted =
      milestone.requiredQuizzes?.every(quizId =>
        this.examProgressService.isQuizCompleted(quizId)
      ) ?? true;

    return modulesCompleted && quizzesCompleted;
  }

  /**
   * Get icon for learning path
   */
  getPathIcon(pathId) {
    const icons = {
      'ap2-complete': '🎓',
      'sql-mastery': '💾',
      'new-topics-2025': '✨',
      'oop-fundamentals': '🏗️',
    };
    return icons[pathId] || '📚';
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

export default IHKLearningPathView;
