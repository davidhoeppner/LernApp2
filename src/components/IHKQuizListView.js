/**
 * IHK Quiz List View
 * Displays all IHK quizzes with filtering
 */

import accessibilityHelper from '../utils/AccessibilityHelper.js';

import EmptyState from './EmptyState.js';
import LoadingSpinner from './LoadingSpinner.js';
import toastNotification from './ToastNotification.js';

class IHKQuizListView {
  constructor(services) {
    this.services = services;
    this.ihkContentService = services.ihkContentService;
    this.stateManager = services.stateManager;
    this.router = services.router;
    this.quizzes = [];
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
        const errorState = EmptyState.create({
          icon: '⚠️',
          title: 'Error Loading Quizzes',
          message: 'Failed to load IHK quizzes. Please try again.',
          action: {
            label: 'Retry',
            onClick: () => this.render(),
          },
        });
        container.innerHTML = '';
        container.appendChild(errorState);
        toastNotification.error('Failed to load IHK quizzes');
      }
    }, 0);

    return container;
  }

  /**
   * Load all quizzes
   */
  async loadQuizzes() {
    // Get all quizzes from IHKContentService
    this.quizzes = await this.ihkContentService.getAllQuizzes();

    // Enrich with progress data
    this.enrichQuizzesWithProgress();
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

    // Quiz grid
    const quizGrid = this.renderQuizGrid();
    content.appendChild(quizGrid);

    return content;
  }

  /**
   * Render header
   */
  renderHeader() {
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `
      <h1>IHK Quizzes</h1>
      <p class="subtitle">Teste dein Wissen mit prüfungsrelevanten Quizzes</p>
    `;
    return header;
  }

  /**
   * Render quiz grid
   */
  renderQuizGrid() {
    const grid = document.createElement('div');
    grid.className = 'quiz-grid';

    if (this.quizzes.length === 0) {
      grid.appendChild(
        EmptyState.create({
          icon: '📝',
          title: 'No Quizzes Found',
          message: 'No IHK quizzes are currently available.',
        })
      );
      return grid;
    }

    this.quizzes.forEach(quiz => {
      const card = this.renderQuizCard(quiz);
      grid.appendChild(card);
    });

    return grid;
  }

  /**
   * Render a single quiz card
   */
  renderQuizCard(quiz) {
    const card = document.createElement('article');
    card.className = 'quiz-card';
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
        <h3>${quiz.title}</h3>
        <div class="quiz-badges">
          ${statusBadge}
        </div>
      </div>
      <p class="quiz-description">${quiz.description}</p>
      <div class="quiz-meta">
        <span class="category">${quiz.category}</span>
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

export default IHKQuizListView;
