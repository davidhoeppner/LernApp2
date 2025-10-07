/**
 * AnswerReviewSection Component
 * Detailed question-by-question review with explanations
 */

class AnswerReviewSection {
  constructor(questions, userAnswers) {
    this.questions = questions;
    this.userAnswers = userAnswers;
  }

  /**
   * Check if a user's answer is correct
   */
  isAnswerCorrect(question, userAnswer) {
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
    if (!answer) return 'No answer provided';
    if (Array.isArray(answer)) return answer.join(', ');
    if (typeof answer === 'boolean') return answer ? 'True' : 'False';
    return String(answer);
  }

  /**
   * Render a single question review
   */
  renderQuestion(question, index) {
    const userAnswer = this.userAnswers[question.id];
    const isCorrect = this.isAnswerCorrect(question, userAnswer);
    const statusClass = isCorrect ? 'correct' : 'incorrect';

    const questionDiv = document.createElement('div');
    questionDiv.className = `question-review ${statusClass}`;

    questionDiv.innerHTML = `
      <div class="question-header">
        <div class="question-number-badge">
          <span class="question-number">Q${index + 1}</span>
          <span class="status-icon">${isCorrect ? '✅' : '❌'}</span>
        </div>
        <div class="question-points">
          ${question.points} ${question.points === 1 ? 'point' : 'points'}
        </div>
      </div>
      
      <div class="question-content">
        <div class="question-text">${question.question}</div>
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

      <div class="answers-comparison">
        <div class="answer-row user-answer">
          <div class="answer-label">Your Answer:</div>
          <div class="answer-value ${statusClass}">
            ${this.formatAnswer(userAnswer)}
          </div>
        </div>
        
        ${
          !isCorrect
            ? `
          <div class="answer-row correct-answer">
            <div class="answer-label">Correct Answer:</div>
            <div class="answer-value correct">
              ${this.formatAnswer(question.correctAnswer)}
            </div>
          </div>
        `
            : ''
        }
      </div>

      ${
        question.explanation
          ? `
        <div class="explanation-section">
          <div class="explanation-header">
            <span class="explanation-icon">💡</span>
            <strong>Explanation</strong>
          </div>
          <div class="explanation-content">
            ${question.explanation}
          </div>
        </div>
      `
          : ''
      }

      ${
        question.options && question.type !== 'code'
          ? `
        <div class="options-review">
          <div class="options-header">Available Options:</div>
          <div class="options-list">
            ${question.options
              .map(option => {
                let optionClass = '';
                if (Array.isArray(question.correctAnswer)) {
                  optionClass = question.correctAnswer.includes(option)
                    ? 'correct-option'
                    : '';
                } else {
                  optionClass =
                    option === question.correctAnswer ? 'correct-option' : '';
                }

                let userSelected = '';
                if (Array.isArray(userAnswer)) {
                  userSelected = userAnswer.includes(option)
                    ? 'user-selected'
                    : '';
                } else {
                  userSelected = userAnswer === option ? 'user-selected' : '';
                }

                return `
                <div class="option-item ${optionClass} ${userSelected}">
                  <span class="option-text">${option}</span>
                  ${optionClass ? '<span class="correct-indicator">✓</span>' : ''}
                  ${userSelected && !optionClass ? '<span class="incorrect-indicator">✗</span>' : ''}
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
      `
          : ''
      }
    `;

    return questionDiv;
  }

  /**
   * Render the complete answer review section
   */
  render() {
    const container = document.createElement('div');
    container.className = 'answer-review-section';

    // Header
    const header = document.createElement('div');
    header.className = 'review-header';
    header.innerHTML = `
      <h2>📋 Review Your Answers</h2>
      <p class="review-description">
        Review each question to understand your performance and learn from any mistakes.
      </p>
    `;
    container.appendChild(header);

    // Questions container
    const questionsContainer = document.createElement('div');
    questionsContainer.className = 'questions-container';

    this.questions.forEach((question, index) => {
      const questionElement = this.renderQuestion(question, index);
      questionsContainer.appendChild(questionElement);
    });

    container.appendChild(questionsContainer);

    return container;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Static method to create and render answer review
   */
  static create(questions, userAnswers) {
    const review = new AnswerReviewSection(questions, userAnswers);
    return review.render();
  }
}

export default AnswerReviewSection;
