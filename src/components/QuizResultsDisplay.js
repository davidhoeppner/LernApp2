/**
 * QuizResultsDisplay Component
 * Enhanced visual display for quiz completion results
 */

class QuizResultsDisplay {
  constructor(score, totalQuestions, totalPoints) {
    this.score = score;
    this.totalQuestions = totalQuestions;
    this.totalPoints = totalPoints;
    this.percentage = Math.round((score / totalPoints) * 100);
  }

  /**
   * Get performance badge based on score percentage
   */
  getPerformanceBadge() {
    if (this.percentage >= 90) {
      return { 
        icon: '🏆', 
        text: 'Excellent', 
        class: 'excellent',
        message: 'Outstanding performance!'
      };
    }
    if (this.percentage >= 80) {
      return { 
        icon: '🥇', 
        text: 'Very Good', 
        class: 'very-good',
        message: 'Great job!'
      };
    }
    if (this.percentage >= 70) {
      return { 
        icon: '🥈', 
        text: 'Good', 
        class: 'good',
        message: 'Well done!'
      };
    }
    if (this.percentage >= 60) {
      return { 
        icon: '🥉', 
        text: 'Pass', 
        class: 'pass',
        message: 'You passed!'
      };
    }
    return { 
      icon: '📚', 
      text: 'Needs Review', 
      class: 'needs-review',
      message: 'Keep studying!'
    };
  }

  /**
   * Render the complete results display
   */
  render() {
    const badge = this.getPerformanceBadge();
    
    const container = document.createElement('div');
    container.className = 'quiz-results-display';
    
    container.innerHTML = `
      <div class="score-display">
        <div class="score-circle ${badge.class}">
          <div class="score-content">
            <span class="percentage">${this.percentage}%</span>
            <span class="fraction">(${this.score}/${this.totalPoints})</span>
          </div>
        </div>
        <div class="performance-badge">
          <span class="badge-icon">${badge.icon}</span>
          <span class="badge-text">${badge.text}</span>
          <p class="badge-message">${badge.message}</p>
        </div>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-fill ${badge.class}" style="width: 0%" data-target="${this.percentage}"></div>
        </div>
        <div class="progress-label">
          ${this.score} out of ${this.totalPoints} points
        </div>
      </div>
      <div class="score-breakdown">
        <div class="breakdown-item">
          <span class="breakdown-value">${this.totalQuestions}</span>
          <span class="breakdown-label">Total Questions</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-value">${Math.round((this.score / this.totalPoints) * this.totalQuestions)}</span>
          <span class="breakdown-label">Correct Answers</span>
        </div>
        <div class="breakdown-item">
          <span class="breakdown-value">${this.totalQuestions - Math.round((this.score / this.totalPoints) * this.totalQuestions)}</span>
          <span class="breakdown-label">Incorrect Answers</span>
        </div>
      </div>
    `;

    // Animate progress bar after render
    setTimeout(() => {
      this.animateProgressBar(container);
    }, 100);

    return container;
  }

  /**
   * Animate the progress bar fill
   */
  animateProgressBar(container) {
    const progressFill = container.querySelector('.progress-fill');
    const targetWidth = progressFill.getAttribute('data-target');
    
    // Animate to target width
    progressFill.style.transition = 'width 1.5s ease-in-out';
    progressFill.style.width = `${targetWidth}%`;
  }

  /**
   * Static method to create and render results display
   */
  static create(score, totalQuestions, totalPoints) {
    const display = new QuizResultsDisplay(score, totalQuestions, totalPoints);
    return display.render();
  }
}

export default QuizResultsDisplay;