import LoadingSpinner from './LoadingSpinner.js';
import toastNotification from './ToastNotification.js';

/**
 * QuizView - Interactive quiz interface
 */
class QuizView {
  constructor(services, params) {
    this.quizService = services.quizService;
    this.router = services.router;
    this.quizId = params.id;
    this.quiz = null;
    this.currentQuestionIndex = 0;
    this.answers = [];
    this.quizState = 'start'; // start, in-progress, review, complete
    this.showingFeedback = false;
  }

  /**
   * Render quiz view
   */
  async render() {
    const container = document.createElement('main');
    container.className = 'quiz-view';
    container.id = 'main-content';
    container.setAttribute('role', 'main');
    container.setAttribute('aria-label', 'Quiz');

    try {
      this.quiz = await this.quizService.getQuizById(this.quizId);

      // Initialize answers array
      if (this.answers.length === 0) {
        this.answers = this.quiz.questions.map(q => ({
          questionId: q.id,
          userAnswer: null,
          isCorrect: null,
        }));
      }

      container.innerHTML = this._renderCurrentState();
      this._attachEventListeners(container);
    } catch (error) {
      console.error('Error rendering quiz:', error);
      container.innerHTML = this._renderError(error.message);
    }

    return container;
  }

  /**
   * Render current state
   */
  _renderCurrentState() {
    switch (this.quizState) {
      case 'start':
        return this._renderStartScreen();
      case 'in-progress':
        return this._renderQuestionScreen();
      case 'complete':
        return this._renderCompleteScreen();
      default:
        return this._renderStartScreen();
    }
  }

  /**
   * Render quiz start screen
   */
  _renderStartScreen() {
    return `
      <div class="quiz-start-screen">
        <div class="quiz-start-content">
          <div class="quiz-icon" aria-hidden="true">📝</div>
          <h1 class="quiz-title">${this.quiz.title}</h1>
          <p class="quiz-description">${this.quiz.description || 'Test your knowledge with this quiz.'}</p>

          <div class="quiz-info" role="list" aria-label="Quiz information">
            <div class="quiz-info-item" role="listitem">
              <span class="info-icon" aria-hidden="true">❓</span>
              <span>${this.quiz.questions.length} Questions</span>
            </div>
            ${
              this.quiz.timeLimit
                ? `
              <div class="quiz-info-item" role="listitem">
                <span class="info-icon" aria-hidden="true">⏱️</span>
                <span>${this.quiz.timeLimit} minutes</span>
              </div>
            `
                : ''
            }
          </div>

          <button class="btn-primary btn-lg" data-action="start-quiz" aria-label="Start taking the quiz">
            Start Quiz
          </button>

          <button class="btn-ghost" data-action="back" aria-label="Go back to quizzes list">
            <span aria-hidden="true">←</span> Back
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render question screen
   */
  _renderQuestionScreen() {
    const question = this.quiz.questions[this.currentQuestionIndex];
    const answer = this.answers[this.currentQuestionIndex];
    const progress =
      ((this.currentQuestionIndex + 1) / this.quiz.questions.length) * 100;

    return `
      <div class="quiz-question-screen">
        ${this._renderProgressIndicator(progress)}

        <div class="quiz-question-container" role="form" aria-labelledby="question-text-${this.currentQuestionIndex}">
          <div class="question-header">
            <span class="question-number" aria-label="Question ${this.currentQuestionIndex + 1} of ${this.quiz.questions.length}">Question ${this.currentQuestionIndex + 1} of ${this.quiz.questions.length}</span>
            <span class="question-type">${this._getQuestionTypeLabel(question.type)}</span>
          </div>

          <h2 id="question-text-${this.currentQuestionIndex}" class="question-text">${question.question}</h2>

          <fieldset class="question-options" aria-label="Answer options">
            <legend class="sr-only">Select your answer</legend>
            ${this._renderOptions(question, answer)}
          </fieldset>

          ${this.showingFeedback ? this._renderFeedback(question, answer) : ''}

          <div class="question-actions" role="group" aria-label="Question navigation">
            ${this._renderNavigationButtons()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render progress indicator
   */
  _renderProgressIndicator(progress) {
    return `
      <div class="quiz-progress" role="region" aria-label="Quiz progress">
        <div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100" aria-label="Quiz progress: ${Math.round(progress)} percent">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>
    `;
  }

  /**
   * Render question options
   */
  _renderOptions(question, answer) {
    return question.options
      .map(
        (option, index) => `
        <label class="option-label ${answer.userAnswer === option ? 'selected' : ''} ${this.showingFeedback ? (option === question.correctAnswer ? 'correct' : answer.userAnswer === option ? 'incorrect' : '') : ''}" data-option="${option}">
          <input 
            type="radio" 
            name="answer" 
            id="option-${index}"
            value="${option}"
            ${answer.userAnswer === option ? 'checked' : ''}
            ${this.showingFeedback ? 'disabled' : ''}
            aria-label="${option}${this.showingFeedback && option === question.correctAnswer ? ' - Correct answer' : ''}${this.showingFeedback && answer.userAnswer === option && option !== question.correctAnswer ? ' - Incorrect answer' : ''}"
          />
          <span class="option-text">${option}</span>
          ${this.showingFeedback && option === question.correctAnswer ? '<span class="option-icon" aria-hidden="true">✓</span>' : ''}
          ${this.showingFeedback && answer.userAnswer === option && option !== question.correctAnswer ? '<span class="option-icon" aria-hidden="true">✗</span>' : ''}
        </label>
      `
      )
      .join('');
  }

  /**
   * Render feedback
   */
  _renderFeedback(question, answer) {
    const isCorrect = answer.isCorrect;

    return `
      <div class="feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}" role="alert" aria-live="polite">
        <div class="feedback-header">
          <span class="feedback-icon" aria-hidden="true">${isCorrect ? '✓' : '✗'}</span>
          <span class="feedback-title">${isCorrect ? 'Correct!' : 'Incorrect'}</span>
        </div>
        <p class="feedback-explanation">${question.explanation}</p>
      </div>
    `;
  }

  /**
   * Render navigation buttons
   */
  _renderNavigationButtons() {
    const answer = this.answers[this.currentQuestionIndex];
    const isLastQuestion =
      this.currentQuestionIndex === this.quiz.questions.length - 1;
    const hasAnswer = answer.userAnswer !== null;

    if (this.showingFeedback) {
      return `
        <button class="btn-primary" data-action="next-question" aria-label="${isLastQuestion ? 'View quiz results' : 'Go to next question'}">
          ${isLastQuestion ? 'View Results' : 'Next Question'} <span aria-hidden="true">→</span>
        </button>
      `;
    }

    return `
      <div class="nav-buttons">
        ${
          this.currentQuestionIndex > 0
            ? `
          <button class="btn-secondary" data-action="previous-question" aria-label="Go to previous question">
            <span aria-hidden="true">←</span> Previous
          </button>
        `
            : '<div></div>'
        }

        <button class="btn-primary" data-action="submit-answer" ${!hasAnswer ? 'disabled' : ''} aria-label="Submit your answer">
          Submit Answer
        </button>
      </div>
    `;
  }

  /**
   * Render complete screen
   */
  _renderCompleteScreen() {
    const score = this._calculateScore();
    const passed = score.score >= 70;

    return `
      <div class="quiz-complete-screen" role="region" aria-labelledby="result-title">
        <div class="quiz-complete-content">
          <div class="result-icon ${passed ? 'result-pass' : 'result-fail'}" aria-hidden="true">
            ${passed ? '🎉' : '📚'}
          </div>

          <h1 id="result-title" class="result-title">${passed ? 'Congratulations!' : 'Keep Learning!'}</h1>
          <p class="result-message">
            ${passed ? 'You passed the quiz!' : 'You can review the material and try again.'}
          </p>

          <div class="result-score" role="status" aria-label="Your score is ${score.score} percent">
            <div class="score-circle">
              <div class="score-value" aria-hidden="true">${score.score}%</div>
              <div class="score-label">Score</div>
            </div>
          </div>

          <div class="result-stats" role="list" aria-label="Quiz statistics">
            <div class="stat-item" role="listitem">
              <div class="stat-value" aria-label="${score.correctAnswers} correct answers">${score.correctAnswers}</div>
              <div class="stat-label">Correct</div>
            </div>
            <div class="stat-item" role="listitem">
              <div class="stat-value" aria-label="${score.incorrectAnswers} incorrect answers">${score.incorrectAnswers}</div>
              <div class="stat-label">Incorrect</div>
            </div>
            <div class="stat-item" role="listitem">
              <div class="stat-value" aria-label="${score.totalQuestions} total questions">${score.totalQuestions}</div>
              <div class="stat-label">Total</div>
            </div>
          </div>

          <div class="result-actions" role="group" aria-label="Quiz completion actions">
            <button class="btn-primary" data-action="review-answers" aria-label="Review your answers">
              Review Answers
            </button>
            <button class="btn-secondary" data-action="retake-quiz" aria-label="Retake the quiz">
              Retake Quiz
            </button>
            <button class="btn-ghost" data-action="back-to-modules" aria-label="Go back to modules">
              Back to Modules
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render error state
   */
  _renderError(message) {
    return `
      <div class="error-state">
        <h2>Unable to load quiz</h2>
        <p>${message}</p>
        <button class="btn-primary" onclick="window.location.hash = '#/quizzes'">
          Back to Quizzes
        </button>
      </div>
    `;
  }

  /**
   * Get question type label
   */
  _getQuestionTypeLabel(type) {
    const labels = {
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True/False',
    };
    return labels[type] || 'Question';
  }

  /**
   * Calculate score
   */
  _calculateScore() {
    const correctAnswers = this.answers.filter(a => a.isCorrect).length;
    const totalQuestions = this.quiz.questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    return {
      score,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      totalQuestions,
    };
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners(container) {
    // Start quiz
    const startBtn = container.querySelector('[data-action="start-quiz"]');
    if (startBtn) {
      startBtn.addEventListener('click', () => this._startQuiz(container));
    }

    // Back button
    const backBtn = container.querySelector('[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.hash = '#/quizzes';
      });
    }

    // Answer selection
    const options = container.querySelectorAll('.option-label');
    options.forEach(option => {
      option.addEventListener('click', () => {
        if (!this.showingFeedback) {
          this._selectAnswer(option.dataset.option, container);
        }
      });
    });

    // Submit answer
    const submitBtn = container.querySelector('[data-action="submit-answer"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this._submitAnswer(container));
    }

    // Previous question
    const prevBtn = container.querySelector(
      '[data-action="previous-question"]'
    );
    if (prevBtn) {
      prevBtn.addEventListener('click', () =>
        this._previousQuestion(container)
      );
    }

    // Next question
    const nextBtn = container.querySelector('[data-action="next-question"]');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this._nextQuestion(container));
    }

    // Review answers
    const reviewBtn = container.querySelector('[data-action="review-answers"]');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => this._reviewAnswers(container));
    }

    // Retake quiz
    const retakeBtn = container.querySelector('[data-action="retake-quiz"]');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => this._retakeQuiz(container));
    }

    // Back to modules
    const backToModulesBtn = container.querySelector(
      '[data-action="back-to-modules"]'
    );
    if (backToModulesBtn) {
      backToModulesBtn.addEventListener('click', () => {
        window.location.hash = '#/modules';
      });
    }
  }

  /**
   * Start quiz
   */
  async _startQuiz(container) {
    this.quizState = 'in-progress';
    this.currentQuestionIndex = 0;
    container.innerHTML = this._renderCurrentState();
    this._attachEventListeners(container);
  }

  /**
   * Select answer
   */
  _selectAnswer(answer, container) {
    this.answers[this.currentQuestionIndex].userAnswer = answer;

    // Update UI
    const options = container.querySelectorAll('.option-label');
    options.forEach(option => {
      if (option.dataset.option === answer) {
        option.classList.add('selected');
      } else {
        option.classList.remove('selected');
      }
    });

    // Enable submit button
    const submitBtn = container.querySelector('[data-action="submit-answer"]');
    if (submitBtn) {
      submitBtn.disabled = false;
    }
  }

  /**
   * Submit answer
   */
  async _submitAnswer(container) {
    const question = this.quiz.questions[this.currentQuestionIndex];
    const answer = this.answers[this.currentQuestionIndex];
    const submitBtn = container.querySelector('[data-action="submit-answer"]');

    try {
      // Show loading state on button
      if (submitBtn) {
        LoadingSpinner.setButtonLoading(submitBtn, true);
      }

      const result = await this.quizService.submitAnswer(
        this.quizId,
        question.id,
        answer.userAnswer
      );

      answer.isCorrect = result.isCorrect;
      this.showingFeedback = true;

      // Re-render to show feedback
      container.innerHTML = this._renderCurrentState();
      this._attachEventListeners(container);
    } catch (error) {
      console.error('Error submitting answer:', error);
      toastNotification.error('Failed to submit answer. Please try again.');

      // Remove loading state
      if (submitBtn) {
        LoadingSpinner.setButtonLoading(submitBtn, false);
      }
    }
  }

  /**
   * Previous question
   */
  _previousQuestion(container) {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.showingFeedback = false;
      container.innerHTML = this._renderCurrentState();
      this._attachEventListeners(container);
    }
  }

  /**
   * Next question
   */
  async _nextQuestion(container) {
    const isLastQuestion =
      this.currentQuestionIndex === this.quiz.questions.length - 1;

    if (isLastQuestion) {
      // Complete quiz
      await this._completeQuiz(container);
    } else {
      this.currentQuestionIndex++;
      this.showingFeedback = false;
      container.innerHTML = this._renderCurrentState();
      this._attachEventListeners(container);
    }
  }

  /**
   * Complete quiz
   */
  async _completeQuiz(container) {
    try {
      const score = this._calculateScore();
      await this.quizService.saveQuizAttempt(this.quizId, score, this.answers);

      this.quizState = 'complete';
      container.innerHTML = this._renderCurrentState();
      this._attachEventListeners(container);
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  }

  /**
   * Review answers
   */
  _reviewAnswers(container) {
    this.quizState = 'in-progress';
    this.currentQuestionIndex = 0;
    this.showingFeedback = true;
    container.innerHTML = this._renderCurrentState();
    this._attachEventListeners(container);
  }

  /**
   * Retake quiz
   */
  _retakeQuiz(container) {
    this.quizState = 'start';
    this.currentQuestionIndex = 0;
    this.answers = this.quiz.questions.map(q => ({
      questionId: q.id,
      userAnswer: null,
      isCorrect: null,
    }));
    this.showingFeedback = false;
    container.innerHTML = this._renderCurrentState();
    this._attachEventListeners(container);
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Cleanup if needed
  }
}

export default QuizView;
