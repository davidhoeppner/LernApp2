import { formatDate } from '../utils/formatUtils.js';

/**
 * ExamChanges2025Component - Display exam changes for 2025
 * Shows new topics, removed topics, and important changes
 */
class ExamChanges2025Component {
  constructor(examChangesData, onModuleClick) {
    this.examChangesData = examChangesData;
    this.onModuleClick = onModuleClick;
  }

  /**
   * Render the component
   */
  render() {
    const container = document.createElement('div');
    container.className = 'exam-changes-2025-component';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Exam changes for 2025');

    container.innerHTML = `
      <div class="exam-changes-header">
        <div class="exam-changes-title-section">
          <h2 class="exam-changes-title">
            <span class="badge badge-primary badge-lg">Neu ab 2025</span>
            Änderungen im Prüfungskatalog
          </h2>
          <p class="exam-changes-subtitle">
            ${this.examChangesData.summary}
          </p>
          <div class="exam-changes-meta">
            <span class="meta-item">
              <strong>Gültig ab:</strong> ${formatDate(this.examChangesData.effectiveDate)}
            </span>
            <span class="meta-item">
              <strong>Prüfungszeitraum:</strong> ${this.examChangesData.examPeriod}
            </span>
          </div>
        </div>
      </div>

      <div class="exam-changes-content">
        ${this._renderNewTopics()}
        ${this._renderRemovedTopics()}
        ${this._renderStudyRecommendations()}
      </div>
    `;

    this._attachEventListeners(container);
    return container;
  }

  /**
   * Render new topics section
   */
  _renderNewTopics() {
    const newTopics = this.examChangesData.majorChanges.filter(
      change => change.category === 'additions'
    );

    const criticalTopics = newTopics.filter(t => t.impact === 'high');
    const importantTopics = newTopics.filter(t => t.impact === 'medium');
    const otherTopics = newTopics.filter(t => t.impact === 'low');

    return `
      <section class="changes-section new-topics-section">
        <h3 class="section-title">
          <span class="section-icon" aria-hidden="true">✨</span>
          Neue Themen
        </h3>

        ${
          criticalTopics.length > 0
            ? `
          <div class="topics-group">
            <h4 class="topics-group-title">
              <span class="badge badge-error">Sehr wichtig</span>
            </h4>
            <div class="topics-list">
              ${criticalTopics.map(topic => this._renderTopicCard(topic, 'new')).join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          importantTopics.length > 0
            ? `
          <div class="topics-group">
            <h4 class="topics-group-title">
              <span class="badge badge-warning">Wichtig</span>
            </h4>
            <div class="topics-list">
              ${importantTopics.map(topic => this._renderTopicCard(topic, 'new')).join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          otherTopics.length > 0
            ? `
          <div class="topics-group">
            <h4 class="topics-group-title">
              <span class="badge badge-default">Weitere Ergänzungen</span>
            </h4>
            <div class="topics-list">
              ${otherTopics.map(topic => this._renderTopicCard(topic, 'new')).join('')}
            </div>
          </div>
        `
            : ''
        }
      </section>
    `;
  }

  /**
   * Render removed topics section
   */
  _renderRemovedTopics() {
    const removedTopics = this.examChangesData.majorChanges.filter(
      change => change.category === 'removals'
    );

    if (removedTopics.length === 0) {
      return '';
    }

    return `
      <section class="changes-section removed-topics-section">
        <h3 class="section-title">
          <span class="section-icon" aria-hidden="true">🗑️</span>
          Gestrichene Themen
        </h3>
        <p class="section-description">
          Diese Themen sind nicht mehr prüfungsrelevant und können beim Lernen übersprungen werden.
        </p>
        <div class="topics-list">
          ${removedTopics.map(topic => this._renderTopicCard(topic, 'removed')).join('')}
        </div>
      </section>
    `;
  }

  /**
   * Render study recommendations section
   */
  _renderStudyRecommendations() {
    const recommendations = this.examChangesData.studyRecommendations;

    return `
      <section class="changes-section recommendations-section">
        <h3 class="section-title">
          <span class="section-icon" aria-hidden="true">📚</span>
          Lernempfehlungen
        </h3>
        <p class="section-description">
          Priorisierte Empfehlungen für die Prüfungsvorbereitung basierend auf den Änderungen.
        </p>
        <div class="recommendations-list">
          ${recommendations.map(rec => this._renderRecommendationCard(rec)).join('')}
        </div>
      </section>
    `;
  }

  /**
   * Render individual topic card
   */
  _renderTopicCard(topic, type) {
    const impactClass = `impact-${topic.impact}`;
    const impactLabel = {
      high: 'Sehr wichtig',
      medium: 'Wichtig',
      low: 'Ergänzung',
    }[topic.impact];

    const isNew = type === 'new';
    const cardClass = isNew
      ? 'topic-card new-topic'
      : 'topic-card removed-topic';

    return `
      <article class="${cardClass} ${impactClass}" data-topic="${this._slugify(topic.title)}">
        <div class="topic-card-header">
          <h4 class="topic-title">${topic.title}</h4>
          <span class="badge badge-${topic.impact === 'high' ? 'error' : topic.impact === 'medium' ? 'warning' : 'default'}">
            ${impactLabel}
          </span>
        </div>
        <p class="topic-description">${topic.description}</p>
        ${topic.details ? `<p class="topic-details">${topic.details}</p>` : ''}
        ${
          topic.replacement
            ? `
          <div class="topic-replacement">
            <strong>Ersetzt durch:</strong> ${topic.replacement}
          </div>
        `
            : ''
        }
        <div class="topic-footer">
          <div class="topic-categories">
            ${topic.affectedCategories
              .map(
                cat => `
              <span class="category-tag">${cat}</span>
            `
              )
              .join('')}
          </div>
          ${
            isNew
              ? `
            <button class="btn-primary btn-sm view-module-btn" data-topic="${this._slugify(topic.title)}">
              Zum Modul
            </button>
          `
              : ''
          }
        </div>
      </article>
    `;
  }

  /**
   * Render recommendation card
   */
  _renderRecommendationCard(recommendation) {
    const priorityClass = `priority-${recommendation.priority}`;
    const priorityLabel = {
      critical: 'Kritisch',
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig',
    }[recommendation.priority];

    const priorityBadge = {
      critical: 'badge-error',
      high: 'badge-warning',
      medium: 'badge-primary',
      low: 'badge-default',
    }[recommendation.priority];

    return `
      <article class="recommendation-card ${priorityClass}">
        <div class="recommendation-header">
          <h4 class="recommendation-topic">${recommendation.topic}</h4>
          <span class="badge ${priorityBadge}">
            ${priorityLabel}
          </span>
        </div>
        <p class="recommendation-reason">${recommendation.reason}</p>
        <div class="recommendation-meta">
          <div class="meta-item">
            <span class="meta-icon" aria-hidden="true">⏱️</span>
            <span><strong>Zeitaufwand:</strong> ca. ${recommendation.estimatedHours} Stunden</span>
          </div>
          ${
            recommendation.resources && recommendation.resources.length > 0
              ? `
            <div class="meta-item">
              <span class="meta-icon" aria-hidden="true">📖</span>
              <span><strong>Ressourcen:</strong> ${recommendation.resources.join(', ')}</span>
            </div>
          `
              : ''
          }
        </div>
        <button class="btn-secondary btn-sm start-learning-btn" data-topic="${this._slugify(recommendation.topic)}">
          Jetzt lernen
        </button>
      </article>
    `;
  }

  /**
   * Create slug from title
   */
  _slugify(text) {
    return text
      .toLowerCase()
      .replace(/[äöü]/g, match => ({ ä: 'ae', ö: 'oe', ü: 'ue' })[match])
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners(container) {
    // View module buttons
    const viewModuleButtons = container.querySelectorAll('.view-module-btn');
    viewModuleButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const topic = e.currentTarget.dataset.topic;
        if (this.onModuleClick) {
          this.onModuleClick(topic, 'new');
        }
      });
    });

    // Start learning buttons
    const startLearningButtons = container.querySelectorAll(
      '.start-learning-btn'
    );
    startLearningButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const topic = e.currentTarget.dataset.topic;
        if (this.onModuleClick) {
          this.onModuleClick(topic, 'recommendation');
        }
      });
    });
  }
}

export default ExamChanges2025Component;
