/* global setTimeout */
/**
 * IHK Progress View Component
 * Displays comprehensive IHK exam preparation progress with category breakdown,
 * weak areas analysis, exam readiness score, and personalized recommendations
 */

import LoadingSpinner from './LoadingSpinner.js';
import EmptyState from './EmptyState.js';
import toastNotification from './ToastNotification.js';
import accessibilityHelper from '../utils/AccessibilityHelper.js';

class IHKProgressView {
  constructor(services) {
    this.services = services;
    this.examProgressService = services.examProgressService;
    this.ihkContentService = services.ihkContentService;
    this.router = services.router;
  }

  /**
   * Render the IHK progress view
   */
  async render() {
    const container = document.createElement('main');
    container.className = 'ihk-progress-view';
    container.id = 'main-content';
    container.setAttribute('role', 'main');
    container.setAttribute('aria-label', 'IHK exam progress page');

    container.innerHTML = LoadingSpinner.render('Loading exam progress...');

    // Load data asynchronously
    setTimeout(async () => {
      try {
        const [examReadiness, categoryProgress, weakAreas, recommendations] =
          await Promise.all([
            this.examProgressService.getExamReadiness(),
            this.examProgressService.getProgressByCategory(),
            this.examProgressService.getWeakAreas(),
            this.examProgressService.getRecommendedModules(),
          ]);

        container.innerHTML = '';
        container.appendChild(
          this.renderContent(
            examReadiness,
            categoryProgress,
            weakAreas,
            recommendations
          )
        );

        this.attachEventListeners(container);
        accessibilityHelper.announce('IHK exam progress loaded');
      } catch (error) {
        console.error('Error loading IHK progress:', error);
        container.innerHTML = this.renderError();
        toastNotification.error('Failed to load exam progress');
      }
    }, 0);

    return container;
  }

  /**
   * Render main content
   */
  renderContent(examReadiness, categoryProgress, weakAreas, recommendations) {
    const content = document.createElement('div');
    content.className = 'ihk-progress-content';

    content.innerHTML = `
      ${this.renderHeader()}
      ${this.renderExamReadiness(examReadiness)}
      ${this.renderCategoryProgress(categoryProgress)}
      ${this.renderWeakAreas(weakAreas)}
      ${this.renderRecommendations(recommendations)}
      ${this.renderExportSection()}
    `;

    return content;
  }

  /**
   * Render header
   */
  renderHeader() {
    return `
      <header class="ihk-progress-header">
        <h1 class="page-title">IHK Prüfungsvorbereitung</h1>
        <p class="page-description">
          Dein Fortschritt für die Abschlussprüfung Teil 2 - Fachinformatiker Anwendungsentwicklung
        </p>
      </header>
    `;
  }

  /**
   * Render exam readiness section
   */
  renderExamReadiness(readiness) {
    const {
      overallReadiness,
      readinessLevel,
      recommendation,
      breakdown,
      statistics,
    } = readiness;

    const levelConfig = {
      excellent: { color: '#10b981', icon: '🎯', label: 'Hervorragend' },
      good: { color: '#3b82f6', icon: '👍', label: 'Gut' },
      moderate: { color: '#f59e0b', icon: '📈', label: 'Solide' },
      'needs-improvement': {
        color: '#ef4444',
        icon: '⚠️',
        label: 'Verbesserungsbedarf',
      },
      insufficient: { color: '#dc2626', icon: '🚨', label: 'Unzureichend' },
    };

    const config = levelConfig[readinessLevel] || levelConfig.moderate;

    return `
      <section class="exam-readiness-section" aria-labelledby="readiness-heading">
        <h2 id="readiness-heading" class="section-title">Prüfungsbereitschaft</h2>
        
        <div class="readiness-card">
          <div class="readiness-main">
            <div class="readiness-circle-container">
              <svg class="readiness-circle" viewBox="0 0 200 200" aria-hidden="true">
                <circle
                  class="readiness-circle-bg"
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="#e5e7eb"
                  stroke-width="12"
                />
                <circle
                  class="readiness-circle-fill"
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="${config.color}"
                  stroke-width="12"
                  stroke-dasharray="${(overallReadiness / 100) * 534.07} 534.07"
                  stroke-linecap="round"
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div class="readiness-circle-text">
                <div class="readiness-icon">${config.icon}</div>
                <div class="readiness-percentage">${overallReadiness}%</div>
                <div class="readiness-level">${config.label}</div>
              </div>
            </div>

            <div class="readiness-info">
              <h3 class="readiness-title">Gesamtbewertung</h3>
              <p class="readiness-recommendation">${recommendation}</p>
              
              <div class="readiness-stats">
                <div class="stat-item">
                  <span class="stat-icon">📚</span>
                  <div class="stat-content">
                    <div class="stat-value">${statistics.completedModules}/${statistics.totalModules}</div>
                    <div class="stat-label">Module abgeschlossen</div>
                  </div>
                </div>
                
                <div class="stat-item">
                  <span class="stat-icon">📝</span>
                  <div class="stat-content">
                    <div class="stat-value">${statistics.quizzesTaken}</div>
                    <div class="stat-label">Quizzes absolviert</div>
                  </div>
                </div>
                
                <div class="stat-item">
                  <span class="stat-icon">✨</span>
                  <div class="stat-content">
                    <div class="stat-value">${statistics.newTopicsCompleted}/${statistics.totalNewTopics}</div>
                    <div class="stat-label">Neue Themen 2025</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="readiness-breakdown">
            <h4 class="breakdown-title">Detaillierte Aufschlüsselung</h4>
            <div class="breakdown-bars">
              ${this.renderProgressBar('Module', breakdown.moduleReadiness, '📚')}
              ${this.renderProgressBar('Quizzes', breakdown.quizReadiness, '📝')}
              ${this.renderProgressBar('Neue Themen 2025', breakdown.newTopicsReadiness, '✨')}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Render progress bar
   */
  renderProgressBar(label, percentage, icon) {
    const color =
      percentage >= 80
        ? '#10b981'
        : percentage >= 60
          ? '#3b82f6'
          : percentage >= 40
            ? '#f59e0b'
            : '#ef4444';

    return `
      <div class="progress-bar-item">
        <div class="progress-bar-header">
          <span class="progress-bar-icon">${icon}</span>
          <span class="progress-bar-label">${label}</span>
          <span class="progress-bar-value">${percentage}%</span>
        </div>
        <div class="progress-bar-track">
          <div 
            class="progress-bar-fill" 
            style="width: ${percentage}%; background-color: ${color};"
            role="progressbar"
            aria-valuenow="${percentage}"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="${label} progress: ${percentage}%"
          ></div>
        </div>
      </div>
    `;
  }

  /**
   * Render category progress section
   */
  renderCategoryProgress(categoryProgress) {
    if (categoryProgress.length === 0) {
      return EmptyState.create({
        icon: '📊',
        title: 'Keine Kategorien',
        message: 'Starte mit deinem ersten Modul!',
      });
    }

    // Group by main category (FÜ vs BP)
    const fueCategories = categoryProgress.filter(c => c.mainCategory === 'FÜ');
    const bpCategories = categoryProgress.filter(c => c.mainCategory === 'BP');

    return `
      <section class="category-progress-section" aria-labelledby="category-heading">
        <h2 id="category-heading" class="section-title">Fortschritt nach Kategorien</h2>
        
        <div class="category-groups">
          ${this.renderCategoryGroup('Fachrichtungsübergreifende Inhalte (FÜ)', fueCategories)}
          ${this.renderCategoryGroup('Berufsprofilgebende Inhalte (BP)', bpCategories)}
        </div>
      </section>
    `;
  }

  /**
   * Render category group
   */
  renderCategoryGroup(title, categories) {
    if (categories.length === 0) return '';

    return `
      <div class="category-group">
        <h3 class="category-group-title">${title}</h3>
        <div class="category-cards">
          ${categories.map(cat => this.renderCategoryCard(cat)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render category card
   */
  renderCategoryCard(category) {
    const statusClass = category.status;
    const relevanceClass = `relevance-${category.examRelevance}`;

    return `
      <article class="category-card ${statusClass} ${relevanceClass}">
        <div class="category-card-header">
          <div class="category-code">${category.categoryCode}</div>
          <span class="category-relevance-badge ${relevanceClass}">
            ${this.getRelevanceLabel(category.examRelevance)}
          </span>
        </div>
        
        <h4 class="category-name">${category.categoryName}</h4>
        
        <div class="category-stats">
          <div class="category-stat">
            <span class="stat-label">Abgeschlossen</span>
            <span class="stat-value">${category.completedModules}/${category.totalModules}</span>
          </div>
          <div class="category-stat">
            <span class="stat-label">In Bearbeitung</span>
            <span class="stat-value">${category.inProgressModules}</span>
          </div>
        </div>
        
        <div class="category-progress-bar">
          <div 
            class="category-progress-fill ${statusClass}"
            style="width: ${category.completionPercentage}%"
            role="progressbar"
            aria-valuenow="${category.completionPercentage}"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="${category.categoryName} progress: ${category.completionPercentage}%"
          ></div>
        </div>
        
        <div class="category-percentage">${category.completionPercentage}% abgeschlossen</div>
      </article>
    `;
  }

  /**
   * Get relevance label
   */
  getRelevanceLabel(relevance) {
    const labels = {
      high: 'Hohe Relevanz',
      medium: 'Mittlere Relevanz',
      low: 'Niedrige Relevanz',
    };
    return labels[relevance] || relevance;
  }

  /**
   * Render weak areas section
   */
  renderWeakAreas(weakAreas) {
    if (weakAreas.length === 0) {
      return `
        <section class="weak-areas-section" aria-labelledby="weak-areas-heading">
          <h2 id="weak-areas-heading" class="section-title">Schwachstellen</h2>
          <div class="success-message">
            <span class="success-icon">🎉</span>
            <div class="success-content">
              <h3>Keine Schwachstellen erkannt!</h3>
              <p>Du machst großartige Fortschritte. Weiter so!</p>
            </div>
          </div>
        </section>
      `;
    }

    return `
      <section class="weak-areas-section" aria-labelledby="weak-areas-heading">
        <h2 id="weak-areas-heading" class="section-title">Schwachstellen & Verbesserungsbereiche</h2>
        
        <div class="weak-areas-list">
          ${weakAreas.map(area => this.renderWeakAreaCard(area)).join('')}
        </div>
      </section>
    `;
  }

  /**
   * Render weak area card
   */
  renderWeakAreaCard(area) {
    const severityConfig = {
      high: { color: '#ef4444', icon: '🚨', label: 'Hohe Priorität' },
      medium: { color: '#f59e0b', icon: '⚠️', label: 'Mittlere Priorität' },
      low: { color: '#3b82f6', icon: 'ℹ️', label: 'Niedrige Priorität' },
    };

    const config = severityConfig[area.severity] || severityConfig.medium;

    let details = '';
    if (area.type === 'quiz-performance') {
      details = `
        <div class="weak-area-details">
          <span>Kategorie: ${area.category}</span>
          <span>Durchschnitt: ${area.averageScore}%</span>
          <span>Versuche: ${area.attempts}</span>
        </div>
      `;
    } else if (area.type === 'incomplete-category') {
      details = `
        <div class="weak-area-details">
          <span>${area.categoryName}</span>
          <span>Fortschritt: ${area.completionPercentage}%</span>
        </div>
      `;
    } else if (area.type === 'new-topics-2025') {
      details = `
        <div class="weak-area-details">
          <span>${area.count} neue Themen noch nicht abgeschlossen</span>
        </div>
      `;
    }

    return `
      <article class="weak-area-card severity-${area.severity}">
        <div class="weak-area-header">
          <span class="weak-area-icon">${config.icon}</span>
          <span class="weak-area-severity" style="color: ${config.color};">${config.label}</span>
        </div>
        ${details}
        <p class="weak-area-recommendation">${area.recommendation}</p>
      </article>
    `;
  }

  /**
   * Render recommendations section
   */
  renderRecommendations(recommendations) {
    if (recommendations.length === 0) {
      return `
        <section class="recommendations-section" aria-labelledby="recommendations-heading">
          <h2 id="recommendations-heading" class="section-title">Empfehlungen</h2>
          <div class="info-message">
            <span class="info-icon">💡</span>
            <p>Keine spezifischen Empfehlungen. Setze dein Lernen fort!</p>
          </div>
        </section>
      `;
    }

    return `
      <section class="recommendations-section" aria-labelledby="recommendations-heading">
        <h2 id="recommendations-heading" class="section-title">Empfohlene Module</h2>
        
        <div class="recommendations-list">
          ${recommendations.map(rec => this.renderRecommendationGroup(rec)).join('')}
        </div>
      </section>
    `;
  }

  /**
   * Render recommendation group
   */
  renderRecommendationGroup(recommendation) {
    const priorityConfig = {
      high: { color: '#ef4444', icon: '🔥', label: 'Hohe Priorität' },
      medium: { color: '#f59e0b', icon: '⭐', label: 'Mittlere Priorität' },
      low: { color: '#3b82f6', icon: '💡', label: 'Niedrige Priorität' },
    };

    const config =
      priorityConfig[recommendation.priority] || priorityConfig.medium;

    return `
      <div class="recommendation-group">
        <div class="recommendation-header">
          <span class="recommendation-icon">${config.icon}</span>
          <h3 class="recommendation-reason">${recommendation.reason}</h3>
          <span class="recommendation-priority" style="color: ${config.color};">${config.label}</span>
        </div>
        
        <div class="recommendation-modules">
          ${recommendation.modules.map(module => this.renderRecommendedModule(module)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render recommended module
   */
  renderRecommendedModule(module) {
    return `
      <article class="recommended-module-card">
        <div class="module-header">
          <h4 class="module-title">${module.title}</h4>
          ${module.newIn2025 ? '<span class="new-badge">Neu 2025</span>' : ''}
        </div>
        
        <div class="module-meta">
          <span class="module-category">${module.category}</span>
          <span class="module-difficulty difficulty-${module.difficulty}">${this.getDifficultyLabel(module.difficulty)}</span>
          <span class="module-relevance relevance-${module.examRelevance}">${this.getRelevanceLabel(module.examRelevance)}</span>
        </div>
        
        <p class="module-description">${module.description || ''}</p>
        
        <button 
          class="btn-secondary module-start-btn" 
          data-module-id="${module.id}"
          data-action="start-module"
        >
          Modul starten →
        </button>
      </article>
    `;
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
   * Render export section
   */
  renderExportSection() {
    return `
      <section class="export-section">
        <div class="export-card">
          <div class="export-content">
            <h3 class="export-title">Fortschritt exportieren</h3>
            <p class="export-description">
              Lade deinen kompletten Prüfungsvorbereitungs-Fortschritt als JSON-Datei herunter.
              Perfekt für Backups oder zur Analyse deines Lernfortschritts.
            </p>
          </div>
          <button class="btn-primary" data-action="export-progress">
            <span>📥</span>
            Fortschritt exportieren
          </button>
        </div>
      </section>
    `;
  }

  /**
   * Render error state
   */
  renderError() {
    return `
      <div class="error-state">
        <h2>Fehler beim Laden</h2>
        <p>Der Fortschritt konnte nicht geladen werden. Bitte versuche es erneut.</p>
        <button class="btn-primary" onclick="window.location.reload()">Seite neu laden</button>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners(container) {
    // Export progress button
    const exportBtn = container.querySelector(
      '[data-action="export-progress"]'
    );
    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        try {
          LoadingSpinner.setButtonLoading(exportBtn, true);
          await new Promise(resolve => setTimeout(resolve, 300));

          await this.examProgressService.exportProgress();

          LoadingSpinner.setButtonLoading(exportBtn, false);
          toastNotification.success('Fortschritt erfolgreich exportiert!');
          accessibilityHelper.announce('Progress exported successfully');
        } catch (error) {
          console.error('Error exporting progress:', error);
          LoadingSpinner.setButtonLoading(exportBtn, false);
          toastNotification.error(
            'Export fehlgeschlagen. Bitte versuche es erneut.'
          );
        }
      });
    }

    // Start module buttons
    const moduleButtons = container.querySelectorAll(
      '[data-action="start-module"]'
    );
    moduleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const moduleId = btn.dataset.moduleId;
        this.router.navigate(`/ihk/modules/${moduleId}`);
      });
    });
  }

  /**
   * Cleanup
   */
  cleanup() {
    // Cleanup if needed
  }
}

export default IHKProgressView;
