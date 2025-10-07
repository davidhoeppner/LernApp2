/**
 * QuizActionButtons Component
 * Action buttons for quiz completion with context-aware options
 */

class QuizActionButtons {
  constructor(quizId, score, totalPoints, router) {
    this.quizId = quizId;
    this.score = score;
    this.totalPoints = totalPoints;
    this.router = router;
    this.percentage = Math.round((score / totalPoints) * 100);
  }

  /**
   * Handle retake quiz action
   */
  retakeQuiz() {
    if (
      confirm(
        'Are you sure you want to retake this quiz? Your current results will be replaced.'
      )
    ) {
      // Reload the current quiz
      window.location.reload();
    }
  }

  /**
   * Handle review incorrect answers action
   */
  reviewIncorrectAnswers() {
    // Scroll to the answer review section
    const reviewSection = document.querySelector('.answer-review-section');
    if (reviewSection) {
      reviewSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      // Highlight incorrect answers
      const incorrectAnswers = reviewSection.querySelectorAll(
        '.question-review.incorrect'
      );
      incorrectAnswers.forEach((element, index) => {
        setTimeout(() => {
          element.classList.add('highlight-incorrect');
          setTimeout(() => {
            element.classList.remove('highlight-incorrect');
          }, 2000);
        }, index * 200);
      });
    }
  }

  /**
   * Handle continue learning action
   */
  continueLearning() {
    // Navigate to modules or learning path
    if (this.router) {
      this.router.navigate('/modules');
    } else {
      window.location.hash = '#/modules';
    }
  }

  /**
   * Handle find related content action
   */
  findRelatedContent() {
    // For low scores, suggest related learning materials
    if (this.router) {
      this.router.navigate(
        '/modules?related=' + encodeURIComponent(this.quizId)
      );
    } else {
      window.location.hash =
        '#/modules?related=' + encodeURIComponent(this.quizId);
    }
  }

  /**
   * Handle back to overview action
   */
  backToOverview() {
    if (this.router) {
      this.router.navigate('/quizzes');
    } else {
      window.location.hash = '#/quizzes';
    }
  }

  /**
   * Handle share results action
   */
  shareResults() {
    const shareText = `I just completed a quiz and scored ${this.percentage}%! 🎉`;

    if (navigator.share) {
      navigator
        .share({
          title: 'Quiz Results',
          text: shareText,
          url: window.location.href,
        })
        .catch(err => console.warn('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard
        .writeText(shareText + ' ' + window.location.href)
        .then(() => {
          // Show temporary notification
          this.showNotification('Results copied to clipboard!');
        })
        .catch(err => {
          console.warn('Error copying to clipboard:', err);
        });
    }
  }

  /**
   * Show temporary notification
   */
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'action-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }

  /**
   * Render the action buttons
   */
  render() {
    const container = document.createElement('div');
    container.className = 'quiz-action-buttons';

    // Primary actions (always shown)
    const primaryActions = document.createElement('div');
    primaryActions.className = 'primary-actions';

    // Retake quiz button
    const retakeBtn = document.createElement('button');
    retakeBtn.className = 'btn btn-primary action-btn';
    retakeBtn.innerHTML = `
      <span class="btn-icon">🔄</span>
      <span class="btn-text">Retake Quiz</span>
    `;
    retakeBtn.addEventListener('click', () => this.retakeQuiz());
    primaryActions.appendChild(retakeBtn);

    // Continue learning button
    const continueBtn = document.createElement('button');
    continueBtn.className = 'btn btn-success action-btn';
    continueBtn.innerHTML = `
      <span class="btn-icon">➡️</span>
      <span class="btn-text">Continue Learning</span>
    `;
    continueBtn.addEventListener('click', () => this.continueLearning());
    primaryActions.appendChild(continueBtn);

    container.appendChild(primaryActions);

    // Secondary actions
    const secondaryActions = document.createElement('div');
    secondaryActions.className = 'secondary-actions';

    // Review incorrect answers (only if there are wrong answers)
    if (this.score < this.totalPoints) {
      const reviewBtn = document.createElement('button');
      reviewBtn.className = 'btn btn-secondary action-btn';
      reviewBtn.innerHTML = `
        <span class="btn-icon">📖</span>
        <span class="btn-text">Review Incorrect Answers</span>
      `;
      reviewBtn.addEventListener('click', () => this.reviewIncorrectAnswers());
      secondaryActions.appendChild(reviewBtn);
    }

    // Find related content (for low scores)
    if (this.percentage < 70) {
      const relatedBtn = document.createElement('button');
      relatedBtn.className = 'btn btn-info action-btn';
      relatedBtn.innerHTML = `
        <span class="btn-icon">🔍</span>
        <span class="btn-text">Find Related Content</span>
      `;
      relatedBtn.addEventListener('click', () => this.findRelatedContent());
      secondaryActions.appendChild(relatedBtn);
    }

    // Share results (for good scores)
    if (this.percentage >= 70) {
      const shareBtn = document.createElement('button');
      shareBtn.className = 'btn btn-outline action-btn';
      shareBtn.innerHTML = `
        <span class="btn-icon">📤</span>
        <span class="btn-text">Share Results</span>
      `;
      shareBtn.addEventListener('click', () => this.shareResults());
      secondaryActions.appendChild(shareBtn);
    }

    // Back to overview
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-outline action-btn';
    backBtn.innerHTML = `
      <span class="btn-icon">📋</span>
      <span class="btn-text">Back to Overview</span>
    `;
    backBtn.addEventListener('click', () => this.backToOverview());
    secondaryActions.appendChild(backBtn);

    container.appendChild(secondaryActions);

    // Add performance-based encouragement message
    const encouragement = document.createElement('div');
    encouragement.className = 'encouragement-message';
    encouragement.innerHTML = this.getEncouragementMessage();
    container.appendChild(encouragement);

    return container;
  }

  /**
   * Get encouragement message based on performance
   */
  getEncouragementMessage() {
    if (this.percentage >= 90) {
      return `
        <div class="encouragement excellent">
          <span class="encouragement-icon">🌟</span>
          <p>Excellent work! You've mastered this topic. Ready for the next challenge?</p>
        </div>
      `;
    }
    if (this.percentage >= 80) {
      return `
        <div class="encouragement very-good">
          <span class="encouragement-icon">🎯</span>
          <p>Great job! You have a solid understanding. Keep up the momentum!</p>
        </div>
      `;
    }
    if (this.percentage >= 70) {
      return `
        <div class="encouragement good">
          <span class="encouragement-icon">👍</span>
          <p>Well done! You passed. Review the explanations to strengthen your knowledge.</p>
        </div>
      `;
    }
    if (this.percentage >= 60) {
      return `
        <div class="encouragement pass">
          <span class="encouragement-icon">📚</span>
          <p>You passed, but there's room for improvement. Review the material and try again!</p>
        </div>
      `;
    }
    return `
      <div class="encouragement needs-review">
        <span class="encouragement-icon">💪</span>
        <p>Don't give up! Review the explanations and related content, then try again. You've got this!</p>
      </div>
    `;
  }

  /**
   * Static method to create and render action buttons
   */
  static create(quizId, score, totalPoints, router = null) {
    const buttons = new QuizActionButtons(quizId, score, totalPoints, router);
    return buttons.render();
  }
}

export default QuizActionButtons;
