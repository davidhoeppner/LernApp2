import LoadingSpinner from './LoadingSpinner.js';
import EmptyState from './EmptyState.js';
import toastNotification from './ToastNotification.js';

/**
 * QuizListView - Display all available quizzes
 */
class QuizListView {
  constructor(services) {
    this.quizService = services.quizService;
    this.moduleService = services.moduleService;
    this.router = services.router;
  }

  /**
   * Render quiz list view
   */
  async render() {
    const container = document.createElement('div');
    container.className = 'quiz-list-view';

    // Show loading state
    const loadingSpinner = LoadingSpinner.create({
      message: 'Loading quizzes...',
      size: 'medium',
    });
    container.appendChild(loadingSpinner);

    try {
      const quizzes = await this.quizService.getQuizzes();
      const modules = await this.moduleService.getModules();

      // Remove loading spinner
      loadingSpinner.remove();

      container.innerHTML = `
        <div class="quiz-list-header">
          <h1 class="page-title">Quizzes</h1>
          <p class="page-description">Test your knowledge with our quizzes</p>
        </div>

        ${this._renderQuizGrid(quizzes, modules)}
      `;

      this._attachEventListeners(container);
    } catch (error) {
      console.error('Error rendering quiz list:', error);
      toastNotification.error('Failed to load quizzes. Please try again.');

      // Remove loading spinner and show error
      loadingSpinner.remove();
      const errorState = EmptyState.error(
        'Unable to load quizzes. Please try again.'
      );
      container.appendChild(errorState);
    }

    return container;
  }

  /**
   * Render quiz grid
   */
  _renderQuizGrid(quizzes, modules) {
    if (quizzes.length === 0) {
      const emptyState = EmptyState.noQuizzes();
      return emptyState.outerHTML;
    }

    const quizCards = quizzes
      .map(quiz => this._renderQuizCard(quiz, modules))
      .join('');

    return `
      <div class="quiz-grid">
        ${quizCards}
      </div>
    `;
  }

  /**
   * Render individual quiz card
   */
  _renderQuizCard(quiz, modules) {
    const relatedModule = modules.find(m => m.id === quiz.moduleId);
    const moduleName = relatedModule ? relatedModule.title : 'General';

    return `
      <div class="quiz-card" data-quiz-id="${quiz.id}">
        <div class="quiz-card-header">
          <div class="quiz-category">${moduleName}</div>
        </div>

        <div class="quiz-card-body">
          <h3 class="quiz-title">${quiz.title}</h3>
          <p class="quiz-description">${quiz.description || 'Test your knowledge'}</p>

          <div class="quiz-meta">
            <div class="quiz-questions">
              <span class="meta-icon">❓</span>
              <span>${quiz.questions.length} questions</span>
            </div>
            ${
              quiz.timeLimit
                ? `
              <div class="quiz-time">
                <span class="meta-icon">⏱️</span>
                <span>${quiz.timeLimit} min</span>
              </div>
            `
                : ''
            }
          </div>
        </div>

        <div class="quiz-card-footer">
          <button class="btn-primary btn-sm" data-action="start-quiz" data-quiz-id="${quiz.id}">
            Start Quiz
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render error state
   */
  _renderError() {
    return `
      <div class="error-state">
        <h2>Unable to load quizzes</h2>
        <p>Please try refreshing the page.</p>
        <button class="btn-primary" onclick="window.location.reload()">Refresh</button>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners(container) {
    // Start quiz buttons
    const startButtons = container.querySelectorAll(
      '[data-action="start-quiz"]'
    );
    startButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const quizId = e.target.dataset.quizId;
        window.location.hash = `#/quiz/${quizId}`;
      });
    });

    // Quiz card click (entire card clickable)
    const quizCards = container.querySelectorAll('.quiz-card');
    quizCards.forEach(card => {
      card.addEventListener('click', e => {
        // Don't trigger if clicking on button
        if (e.target.closest('button')) return;

        const quizId = card.dataset.quizId;
        window.location.hash = `#/quiz/${quizId}`;
      });

      // Add hover cursor
      card.style.cursor = 'pointer';
    });
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Cleanup if needed
  }
}

export default QuizListView;
