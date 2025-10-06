/**
 * NotFoundView - 404 Page for invalid routes
 */
class NotFoundView {
  constructor(services) {
    this.services = services;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'not-found-view';
    container.innerHTML = `
      <div class="not-found-content">
        <div class="not-found-icon" aria-hidden="true">🔍</div>
        <h1 class="not-found-title">Page Not Found</h1>
        <p class="not-found-message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div class="not-found-actions">
          <button class="btn btn-primary" id="go-home-btn">
            Go to Home
          </button>
          <button class="btn btn-secondary" id="go-back-btn">
            Go Back
          </button>
        </div>
        <div class="not-found-suggestions">
          <h2>You might be interested in:</h2>
          <ul class="suggestion-list">
            <li>
              <a href="#/modules" class="suggestion-link">
                📚 Browse Learning Modules
              </a>
            </li>
            <li>
              <a href="#/quizzes" class="suggestion-link">
                📝 Take a Quiz
              </a>
            </li>
            <li>
              <a href="#/progress" class="suggestion-link">
                📊 View Your Progress
              </a>
            </li>
          </ul>
        </div>
      </div>
    `;

    // Add event listeners
    setTimeout(() => {
      const goHomeBtn = container.querySelector('#go-home-btn');
      const goBackBtn = container.querySelector('#go-back-btn');

      if (goHomeBtn) {
        goHomeBtn.addEventListener('click', () => {
          window.location.hash = '#/';
        });
      }

      if (goBackBtn) {
        goBackBtn.addEventListener('click', () => {
          window.history.back();
        });
      }
    }, 0);

    return container;
  }
}

export default NotFoundView;
