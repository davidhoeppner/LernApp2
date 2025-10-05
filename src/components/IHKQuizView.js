/**
 * IHK Quiz View Component
 * Displays IHK-specific quizzes with metadata, questions, and results
 */

import accessibilityHelper from '../utils/AccessibilityHelper.js';

import EmptyState from './EmptyState.js';
import LoadingSpinner from './LoadingSpinner.js';
import toastNotification from './ToastNotification.js';

class IHKQuizView {
  constructor(services) {
    this.services = services;
    this.ihkContentService = services.ihkContentService;
    this.quizService = services.quizService;
    this.router = services.router;
    this.quiz = null;
    this.currentQuestionIndex = 0;
    this.answers = {};
    this.showResults = false;
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Render the quiz view
   */
  async render(quizId) {
    const container = document.createElement('div');
    container.className = 'ihk-quiz-view';
    container.innerHTML = LoadingSpinner.render('Loading quiz...');

    // Load quiz asynchronously
    window.setTimeout(async () => {
      try {
        this.quiz = await this.ihkContentService.getQuizById(quizId);

        if (!this.quiz) {
          const errorState = EmptyState.create({
            icon: '📝',
            title: 'Quiz Not Found',
            message: 'The requested quiz could not be found.',
            action: {
              label: 'Back to Overview',
              onClick: () => this.router.navigate('/ihk'),
            },
          });
          container.innerHTML = '';
          container.appendChild(errorState);
          return;
        }

        this.startTime = Date.now();
        container.innerHTML = '';
        container.appendChild(this.renderContent());
        accessibilityHelper.announce(`Quiz loaded: ${this.quiz.title}`);
      } catch (error) {
        console.error('Error loading quiz:', error);
        const errorState = EmptyState.create({
          icon: '⚠️',
          title: 'Error Loading Quiz',
          message: 'Failed to load quiz content. Please try again.',
          action: {
            label: 'Retry',
            onClick: () => this.render(quizId),
          },
        });
        container.innerHTML = '';
        container.appendChild(errorState);
        toastNotification.error('Failed to load quiz');
      }
    }, 0);

    return container;
  }

  /**
   * Render the main content
   */
  renderContent() {
    const content = document.createElement('div');
    content.className = 'ihk-quiz-content';

    if (this.showResults) {
      content.appendChild(this.renderResults());
    } else {
      // Breadcrumb
      const breadcrumb = this.renderBreadcrumb();
      content.appendChild(breadcrumb);

      // Quiz header
      const header = this.renderHeader();
      content.appendChild(header);

      // Quiz progress
      const progress = this.renderProgress();
      content.appendChild(progress);

      // Current question
      const question = this.renderQuestion();
      content.appendChild(question);

      // Navigation
      const navigation = this.renderNavigation();
      content.appendChild(navigation);
    }

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
        <li><a href="#/ihk">IHK AP2</a></li>
        <li><a href="#/quizzes">Quizzes</a></li>
        <li><span aria-current="page">${this.quiz.title}</span></li>
      </ol>
    `;

    return nav;
  }

  /**
   * Render quiz header with metadata
   */
  renderHeader() {
    const header = document.createElement('header');
    header.className = 'quiz-header';

    const badges = [];
    if (this.quiz.newIn2025) {
      badges.push('<span class="badge badge-new">Neu 2025</span>');
    }

    header.innerHTML = `
      <div class="quiz-badges">
        ${badges.join('')}
      </div>
      <h1>${this.quiz.title}</h1>
      <p class="quiz-description">${this.quiz.description}</p>
      <div class="quiz-metadata">
        <span class="meta-item">
          <strong>Kategorie:</strong> ${this.quiz.category}
        </span>
        <span class="meta-item">
          <strong>Schwierigkeit:</strong> 
          <span class="difficulty difficulty-${this.quiz.difficulty}">
            ${this.getDifficultyLabel(this.quiz.difficulty)}
          </span>
        </span>
        <span class="meta-item">
          <strong>Fragen:</strong> ${this.quiz.questions.length}
        </span>
        ${
          this.quiz.timeLimit
            ? `
          <span class="meta-item">
            <strong>Zeitlimit:</strong> ${this.quiz.timeLimit} Min.
          </span>
        `
            : ''
        }
        <span class="meta-item">
          <strong>Bestehensgrenze:</strong> ${this.quiz.passingScore}%
        </span>
      </div>
    `;

    return header;
  }

  /**
   * Render quiz progress
   */
  renderProgress() {
    const progress = document.createElement('div');
    progress.className = 'quiz-progress';

    const percentage =
      ((this.currentQuestionIndex + 1) / this.quiz.questions.length) * 100;

    progress.innerHTML = `
      <div class="progress-info">
        <span>Frage ${this.currentQuestionIndex + 1} von ${this.quiz.questions.length}</span>
        ${
          this.quiz.timeLimit
            ? `
          <span class="time-remaining" id="time-remaining">
            Zeit: ${this.quiz.timeLimit}:00
          </span>
        `
            : ''
        }
      </div>
      <div class="progress-bar" role="progressbar" 
           aria-valuenow="${percentage}" 
           aria-valuemin="0" 
           aria-valuemax="100"
           aria-label="Quiz progress">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
    `;

    return progress;
  }

  /**
   * Render current question
   */
  renderQuestion() {
    const section = document.createElement('section');
    section.className = 'quiz-question';
    section.setAttribute('aria-labelledby', 'question-heading');

    const question = this.quiz.questions[this.currentQuestionIndex];
    const questionNumber = this.currentQuestionIndex + 1;

    section.innerHTML = `
      <h2 id="question-heading">Frage ${questionNumber}</h2>
      <div class="question-content">
        <p class="question-text">${question.question}</p>
        ${
          question.code
            ? `
          <div class="code-block-wrapper">
            <div class="code-header">
              <span class="language-label">${question.language?.toUpperCase() || 'CODE'}</span>
            </div>
            <pre><code class="language-${question.language || 'text'}">${this.escapeHtml(question.code)}</code></pre>
          </div>
        `
            : ''
        }
      </div>
      <div class="question-options">
        ${this.renderOptions(question)}
      </div>
      <div class="question-points">
        <span>${question.points} ${question.points === 1 ? 'Punkt' : 'Punkte'}</span>
      </div>
    `;

    return section;
  }

  /**
   * Render question options based on type
   */
  renderOptions(question) {
    const questionId = question.id;
    const savedAnswer = this.answers[questionId];

    switch (question.type) {
      case 'single-choice':
        return question.options
          .map(
            option => `
          <label class="option-label">
            <input 
              type="radio" 
              name="question-${questionId}" 
              value="${option}"
              ${savedAnswer === option ? 'checked' : ''}
              onchange="window.ihkQuizView.saveAnswer('${questionId}', this.value)"
            />
            <span class="option-text">${option}</span>
          </label>
        `
          )
          .join('');

      case 'multiple-choice': {
        const savedAnswers = savedAnswer || [];
        return question.options
          .map(
            option => `
          <label class="option-label">
            <input 
              type="checkbox" 
              name="question-${questionId}" 
              value="${option}"
              ${savedAnswers.includes(option) ? 'checked' : ''}
              onchange="window.ihkQuizView.saveMultipleAnswer('${questionId}', this.value, this.checked)"
            />
            <span class="option-text">${option}</span>
          </label>
        `
          )
          .join('');
      }

      case 'true-false':
        return `
          <label class="option-label">
            <input 
              type="radio" 
              name="question-${questionId}" 
              value="true"
              ${savedAnswer === 'true' ? 'checked' : ''}
              onchange="window.ihkQuizView.saveAnswer('${questionId}', this.value)"
            />
            <span class="option-text">Wahr</span>
          </label>
          <label class="option-label">
            <input 
              type="radio" 
              name="question-${questionId}" 
              value="false"
              ${savedAnswer === 'false' ? 'checked' : ''}
              onchange="window.ihkQuizView.saveAnswer('${questionId}', this.value)"
            />
            <span class="option-text">Falsch</span>
          </label>
        `;

      case 'code':
        return `
          <textarea 
            class="code-answer"
            placeholder="Gib deine Antwort hier ein..."
            onchange="window.ihkQuizView.saveAnswer('${questionId}', this.value)"
          >${savedAnswer || ''}</textarea>
        `;

      default:
        return '<p>Unbekannter Fragetyp</p>';
    }
  }

  /**
   * Render navigation buttons
   */
  renderNavigation() {
    const nav = document.createElement('div');
    nav.className = 'quiz-navigation';

    const isFirst = this.currentQuestionIndex === 0;
    const isLast = this.currentQuestionIndex === this.quiz.questions.length - 1;

    nav.innerHTML = `
      <button 
        class="btn btn-secondary"
        ${isFirst ? 'disabled' : ''}
        onclick="window.ihkQuizView.previousQuestion()"
      >
        ← Zurück
      </button>
      ${
        isLast
          ? `
        <button 
          class="btn btn-primary"
          onclick="window.ihkQuizView.submitQuiz()"
        >
          Quiz abschließen
        </button>
      `
          : `
        <button 
          class="btn btn-primary"
          onclick="window.ihkQuizView.nextQuestion()"
        >
          Weiter →
        </button>
      `
      }
    `;

    // Store reference for button handlers
    window.ihkQuizView = this;

    return nav;
  }

  /**
   * Render results
   */
  renderResults() {
    const results = document.createElement('div');
    results.className = 'quiz-results';

    const score = this.calculateScore();
    const passed = score.percentage >= this.quiz.passingScore;
    const timeTaken = this.endTime
      ? Math.round((this.endTime - this.startTime) / 1000 / 60)
      : 0;

    results.innerHTML = `
      <div class="results-header">
        <div class="results-icon ${passed ? 'passed' : 'failed'}">
          ${passed ? '✓' : '✗'}
        </div>
        <h1>${passed ? 'Bestanden!' : 'Nicht bestanden'}</h1>
        <p class="results-score">${score.earned} / ${score.total} Punkte (${score.percentage}%)</p>
      </div>

      <div class="results-stats">
        <div class="stat-card">
          <div class="stat-value">${score.correct}</div>
          <div class="stat-label">Richtig</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${score.incorrect}</div>
          <div class="stat-label">Falsch</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${timeTaken}</div>
          <div class="stat-label">Minuten</div>
        </div>
      </div>

      <div class="results-breakdown">
        <h2>Antworten im Detail</h2>
        ${this.renderAnswerBreakdown()}
      </div>

      <div class="results-actions">
        <button 
          class="btn btn-primary"
          onclick="window.location.reload()"
        >
          Quiz wiederholen
        </button>
        <button 
          class="btn btn-secondary"
          onclick="window.location.hash = '#/quizzes'"
        >
          Zurück zur Übersicht
        </button>
      </div>
    `;

    return results;
  }

  /**
   * Render answer breakdown
   */
  renderAnswerBreakdown() {
    return this.quiz.questions
      .map((question, index) => {
        const userAnswer = this.answers[question.id];
        const isCorrect = this.checkAnswer(question, userAnswer);

        return `
        <div class="answer-item ${isCorrect ? 'correct' : 'incorrect'}">
          <div class="answer-header">
            <span class="answer-number">Frage ${index + 1}</span>
            <span class="answer-status">${isCorrect ? '✓ Richtig' : '✗ Falsch'}</span>
          </div>
          <p class="answer-question">${question.question}</p>
          <div class="answer-details">
            <p><strong>Deine Antwort:</strong> ${this.formatAnswer(userAnswer)}</p>
            <p><strong>Richtige Antwort:</strong> ${this.formatAnswer(question.correctAnswer)}</p>
          </div>
          ${
            question.explanation
              ? `
            <div class="answer-explanation">
              <strong>Erklärung:</strong>
              <p>${question.explanation}</p>
            </div>
          `
              : ''
          }
        </div>
      `;
      })
      .join('');
  }

  /**
   * Save single answer
   */
  saveAnswer(questionId, value) {
    this.answers[questionId] = value;
  }

  /**
   * Save multiple choice answer
   */
  saveMultipleAnswer(questionId, value, checked) {
    if (!this.answers[questionId]) {
      this.answers[questionId] = [];
    }
    if (checked) {
      this.answers[questionId].push(value);
    } else {
      this.answers[questionId] = this.answers[questionId].filter(
        v => v !== value
      );
    }
  }

  /**
   * Navigate to next question
   */
  nextQuestion() {
    if (this.currentQuestionIndex < this.quiz.questions.length - 1) {
      this.currentQuestionIndex++;
      this.updateView();
      accessibilityHelper.announce(
        `Question ${this.currentQuestionIndex + 1} of ${this.quiz.questions.length}`
      );
    }
  }

  /**
   * Navigate to previous question
   */
  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.updateView();
      accessibilityHelper.announce(
        `Question ${this.currentQuestionIndex + 1} of ${this.quiz.questions.length}`
      );
    }
  }

  /**
   * Submit quiz
   */
  async submitQuiz() {
    this.endTime = Date.now();
    this.showResults = true;

    // Calculate score
    const scoreData = this.calculateScore();

    // Convert answers object to array format for QuizService
    const answersArray = this.quiz.questions.map(question => ({
      questionId: question.id,
      userAnswer: this.answers[question.id],
      isCorrect: this.checkAnswer(question, this.answers[question.id]),
    }));

    // Save attempt using QuizService
    await this.quizService.saveQuizAttempt(
      this.quiz.id,
      scoreData.percentage,
      answersArray
    );

    this.updateView();
    accessibilityHelper.announce('Quiz completed. Results are now displayed.');
  }

  /**
   * Update view
   */
  updateView() {
    const container = document.querySelector('.ihk-quiz-content');
    if (container) {
      const newContent = this.renderContent();
      container.replaceWith(newContent);
    }
  }

  /**
   * Calculate score
   */
  calculateScore() {
    let earned = 0;
    let total = 0;
    let correct = 0;
    let incorrect = 0;

    this.quiz.questions.forEach(question => {
      total += question.points;
      const userAnswer = this.answers[question.id];
      const isCorrect = this.checkAnswer(question, userAnswer);

      if (isCorrect) {
        earned += question.points;
        correct++;
      } else {
        incorrect++;
      }
    });

    return {
      earned,
      total,
      percentage: Math.round((earned / total) * 100),
      correct,
      incorrect,
    };
  }

  /**
   * Check if answer is correct
   */
  checkAnswer(question, userAnswer) {
    if (!userAnswer) return false;

    if (Array.isArray(question.correctAnswer)) {
      if (!Array.isArray(userAnswer)) return false;
      return (
        JSON.stringify(userAnswer.sort()) ===
        JSON.stringify(question.correctAnswer.sort())
      );
    }

    return userAnswer === question.correctAnswer;
  }

  /**
   * Format answer for display
   */
  formatAnswer(answer) {
    if (!answer) return 'Keine Antwort';
    if (Array.isArray(answer)) return answer.join(', ');
    return answer;
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

export default IHKQuizView;
