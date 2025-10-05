/**
 * IHK Learning Path List View
 * Displays all available learning paths
 */

import accessibilityHelper from '../utils/AccessibilityHelper.js';

class IHKLearningPathListView {
  constructor(services) {
    this.services = services;
    this.ihkContentService = services.ihkContentService;
    this.router = services.router;
  }

  /**
   * Render the learning path list view
   */
  async render() {
    const container = document.createElement('div');
    container.className = 'ihk-learning-path-list-view';

    // Header
    const header = this.renderHeader();
    container.appendChild(header);

    // Learning paths grid
    const pathsGrid = this.renderPathsGrid();
    container.appendChild(pathsGrid);

    accessibilityHelper.announce('Learning paths loaded');

    return container;
  }

  /**
   * Render header
   */
  renderHeader() {
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `
      <h1>Lernpfade</h1>
      <p class="subtitle">Strukturierte Lernpfade für deine IHK Prüfungsvorbereitung</p>
    `;
    return header;
  }

  /**
   * Render learning paths grid
   */
  renderPathsGrid() {
    const grid = document.createElement('div');
    grid.className = 'learning-paths-grid';

    const paths = this.ihkContentService.getRecommendedLearningPaths();

    paths.forEach(path => {
      const card = this.renderPathCard(path);
      grid.appendChild(card);
    });

    return grid;
  }

  /**
   * Render a single learning path card
   */
  renderPathCard(path) {
    const card = document.createElement('article');
    card.className = 'learning-path-card';

    card.innerHTML = `
      <div class="path-icon">${this.getPathIcon(path.id)}</div>
      <h3>${path.title}</h3>
      <p>${path.description}</p>
      <div class="path-meta">
        <span class="difficulty difficulty-${path.difficulty}">
          ${this.getDifficultyLabel(path.difficulty)}
        </span>
        <span class="duration">
          <span aria-hidden="true">⏱️</span>
          ${path.estimatedDuration}h
        </span>
      </div>
      <button 
        class="btn btn-primary"
        onclick="window.location.hash = '#/ihk/learning-paths/${path.id}'"
        aria-label="Start learning path: ${path.title}"
      >
        Lernpfad starten
      </button>
    `;

    return card;
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

export default IHKLearningPathListView;
