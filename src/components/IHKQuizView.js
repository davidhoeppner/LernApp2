/**
 * IHK Quiz View Component
 * Displays IHK-specific quizzes with metadata, questions, and results
 */

import accessibilityHelper from '../utils/AccessibilityHelper.js';

import EmptyState from './EmptyState.js';
import LoadingSpinner from './LoadingSpinner.js';
import toastNotification from './ToastNotification.js';
import QuizResultsDisplay from './QuizResultsDisplay.js';
import AnswerReviewSection from './AnswerReviewSection.js';
import QuizActionButtons from './QuizActionButtons.js';

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

    // Timer properties
    this.timerInterval = null;
    this.timeRemaining = 0; // in seconds
    this.timerStarted = false;
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
              onClick: () => this.router.navigate('/'),
            },
          });
          container.innerHTML = '';
          container.appendChild(errorState);
          return;
        }

        this.startTime = Date.now();

        // Initialize timer if quiz has time limit
        if (this.quiz.timeLimit) {
          this.initializeTimer();
        }

        container.innerHTML = '';
        container.appendChild(this.renderContent());

        // Set up page visibility handling for timer
        this.setupPageVisibilityHandling();

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
        <li><a href="#/">Home</a></li>
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
          <span class="time-remaining" id="time-remaining" role="timer" aria-live="polite">
            Zeit: ${this.getFormattedTimeRemaining() || this.quiz.timeLimit + ':00'}
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
   * Render results with enhanced components
   */
  renderResults() {
    const results = document.createElement('div');
    results.className = 'quiz-results-enhanced';

    const score = this.calculateScore();
    const passed = score.percentage >= this.quiz.passingScore;
    const timeTaken = this.endTime
      ? Math.round((this.endTime - this.startTime) / 1000 / 60)
      : 0;

    // Header with pass/fail status
    const header = document.createElement('div');
    header.className = 'enhanced-results-header';
    header.innerHTML = `
      <div class="results-status ${passed ? 'passed' : 'failed'}">
        <div class="status-icon">${passed ? '🎉' : '📚'}</div>
        <h1>${passed ? 'Congratulations! You Passed!' : 'Keep Learning!'}</h1>
        <p class="status-message">
          ${
            passed
              ? 'Great job! You have successfully completed this quiz.'
              : "Don't worry, review the explanations and try again."
          }
        </p>
        ${timeTaken > 0 ? `<p class="time-taken">Completed in ${timeTaken} minutes</p>` : ''}
      </div>
    `;
    results.appendChild(header);

    // Enhanced results display
    const resultsDisplay = QuizResultsDisplay.create(
      score.earned,
      this.quiz.questions.length,
      score.total
    );
    results.appendChild(resultsDisplay);

    // Answer review section
    const answerReview = AnswerReviewSection.create(
      this.quiz.questions,
      this.answers
    );
    results.appendChild(answerReview);

    // Action buttons
    const actionButtons = QuizActionButtons.create(
      this.quiz.id,
      score.earned,
      score.total,
      this.router
    );
    results.appendChild(actionButtons);

    return results;
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
    // Stop the timer
    this.stopTimer();

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

  /**
   * Initialize the quiz timer
   */
  initializeTimer() {
    if (!this.quiz.timeLimit || this.timerStarted) return;

    // Convert minutes to seconds
    this.timeRemaining = this.quiz.timeLimit * 60;
    this.timerStarted = true;

    // Start the timer
    this.startTimer();
  }

  /**
   * Start the countdown timer
   */
  startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();

      // Check if time is up
      if (this.timeRemaining <= 0) {
        this.handleTimeUp();
      }

      // Warning when 5 minutes remaining
      if (this.timeRemaining === 300) {
        toastNotification.warning('Nur noch 5 Minuten verbleibend!');
        accessibilityHelper.announce('Warning: 5 minutes remaining');
      }

      // Warning when 1 minute remaining
      if (this.timeRemaining === 60) {
        toastNotification.warning('Nur noch 1 Minute verbleibend!');
        accessibilityHelper.announce('Warning: 1 minute remaining');
      }

      // Warning when 30 seconds remaining
      if (this.timeRemaining === 30) {
        toastNotification.error('Nur noch 30 Sekunden!');
        accessibilityHelper.announce('Warning: 30 seconds remaining');
      }
    }, 1000);
  }

  /**
   * Update the timer display
   */
  updateTimerDisplay() {
    const timerElement = document.getElementById('time-remaining');
    if (!timerElement) return;

    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    timerElement.textContent = `Zeit: ${timeString}`;

    // Add visual warning when time is running low
    if (this.timeRemaining <= 300) {
      // 5 minutes
      timerElement.classList.add('time-warning');
    }

    if (this.timeRemaining <= 60) {
      // 1 minute
      timerElement.classList.add('time-critical');
    }
  }

  /**
   * Handle timer expiration
   */
  handleTimeUp() {
    this.stopTimer();
    toastNotification.error('Zeit abgelaufen! Quiz wird automatisch beendet.');
    accessibilityHelper.announce(
      'Time is up! Quiz will be submitted automatically.'
    );

    // Auto-submit the quiz
    setTimeout(() => {
      this.submitQuiz();
    }, 2000);
  }

  /**
   * Stop the timer
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Pause the timer (for when user navigates away)
   */
  pauseTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Resume the timer
   */
  resumeTimer() {
    if (this.timerStarted && !this.timerInterval && this.timeRemaining > 0) {
      this.startTimer();
    }
  }

  /**
   * Get formatted time remaining
   */
  getFormattedTimeRemaining() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Setup page visibility handling to pause/resume timer
   */
  setupPageVisibilityHandling() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, pause timer
        this.pauseTimer();
      } else {
        // Page is visible, resume timer
        this.resumeTimer();
      }
    });

    // Handle window focus/blur
    window.addEventListener('blur', () => {
      this.pauseTimer();
    });

    window.addEventListener('focus', () => {
      this.resumeTimer();
    });
  }

  /**
   * Cleanup timer when component is destroyed
   */
  cleanup() {
    this.stopTimer();

    // Remove event listeners
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
  }
}

export default IHKQuizView;
