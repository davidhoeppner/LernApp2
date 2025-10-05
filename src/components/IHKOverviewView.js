/**
 * IHK Overview View Component
 * Displays overview of IHK AP2 content with categories, filters, and learning paths
 */

/* global setTimeout */

import CategoryFilterComponent from './CategoryFilterComponent.js';
import ExamChanges2025Component from './ExamChanges2025Component.js';
import SearchComponent from './SearchComponent.js';
import LoadingSpinner from './LoadingSpinner.js';
import EmptyState from './EmptyState.js';
import toastNotification from './ToastNotification.js';
import accessibilityHelper from '../utils/AccessibilityHelper.js';

class IHKOverviewView {
  constructor(services) {
    this.services = services;
    this.ihkContentService = services.ihkContentService;
    this.examProgressService = services.examProgressService;
    this.router = services.router;
    this.categoryFilter = null;
    this.examChanges = null;
    this.searchComponent = null;
    this.currentFilters = {
      category: 'all',
      examRelevance: 'all',
      newIn2025: false,
      difficulty: 'all',
    };
  }

  /**
   * Render the IHK overview
   */
  async render() {
    const container = document.createElement('div');
    container.className = 'ihk-overview-view';
    container.innerHTML = LoadingSpinner.render('Loading IHK content...');

    // Load data asynchronously
    setTimeout(async () => {
      try {
        await this.loadData();
        container.innerHTML = '';
        container.appendChild(this.renderContent());
        accessibilityHelper.announce('IHK overview loaded');
      } catch (error) {
        console.error('Error loading IHK overview:', error);
        const errorState = EmptyState.create({
          icon: '⚠️',
          title: 'Error Loading Content',
          message: 'Failed to load IHK content. Please try again.',
          action: {
            label: 'Retry',
            onClick: () => this.render(),
          },
        });
        container.innerHTML = '';
        container.appendChild(errorState);
        toastNotification.error('Failed to load IHK content');
      }
    }, 0);

    return container;
  }

  /**
   * Load required data
   */
  async loadData() {
    await this.ihkContentService.loadCategories();
  }

  /**
   * Render the main content
   */
  renderContent() {
    const content = document.createElement('div');
    content.className = 'ihk-overview-content';

    // Header
    const header = this.renderHeader();
    content.appendChild(header);

    // Exam Changes 2025 Component
    this.examChanges = new ExamChanges2025Component(this.services);
    const examChangesEl = this.examChanges.render();
    content.appendChild(examChangesEl);

    // Search Component
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-section';
    this.searchComponent = new SearchComponent(this.ihkContentService);
    this.searchComponent.render(searchContainer, this.currentFilters);
    content.appendChild(searchContainer);

    // Category Filter Component
    this.categoryFilter = new CategoryFilterComponent(
      this.services,
      this.handleFilterChange.bind(this)
    );
    const filterEl = this.categoryFilter.render();
    content.appendChild(filterEl);

    // Recommended Learning Paths
    const learningPaths = this.renderRecommendedLearningPaths();
    content.appendChild(learningPaths);

    // Quick Stats
    const stats = this.renderQuickStats();
    content.appendChild(stats);

    // Category Overview
    const categories = this.renderCategoryOverview();
    content.appendChild(categories);

    return content;
  }

  /**
   * Render header section
   */
  renderHeader() {
    const header = document.createElement('div');
    header.className = 'ihk-overview-header';
    header.innerHTML = `
      <h1>IHK Fachinformatiker Anwendungsentwicklung</h1>
      <p class="subtitle">Abschlussprüfung Teil 2 - Prüfungskatalog 2025</p>
      <p class="description">
        Bereite dich optimal auf die IHK Abschlussprüfung vor. 
        Alle Inhalte basieren auf dem aktuellen Prüfungskatalog ab 2025.
      </p>
    `;
    return header;
  }

  /**
   * Render recommended learning paths
   */
  renderRecommendedLearningPaths() {
    const section = document.createElement('section');
    section.className = 'recommended-learning-paths';
    section.setAttribute('aria-labelledby', 'learning-paths-heading');

    const paths = this.ihkContentService.getRecommendedLearningPaths();

    section.innerHTML = `
      <h2 id="learning-paths-heading">Empfohlene Lernpfade</h2>
      <div class="learning-paths-grid">
        ${paths
          .map(
            path => `
          <article class="learning-path-card" role="article">
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
          </article>
        `
          )
          .join('')}
      </div>
    `;

    return section;
  }

  /**
   * Render quick statistics
   */
  renderQuickStats() {
    const section = document.createElement('section');
    section.className = 'quick-stats';
    section.setAttribute('aria-labelledby', 'stats-heading');

    const stats = this.ihkContentService.getContentStats();
    const progress = this.examProgressService.getProgressByCategory();

    section.innerHTML = `
      <h2 id="stats-heading">Dein Fortschritt</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.totalModules}</div>
          <div class="stat-label">Module verfügbar</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalQuizzes}</div>
          <div class="stat-label">Quizzes verfügbar</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${progress.completedModules || 0}</div>
          <div class="stat-label">Module abgeschlossen</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.round(progress.overallProgress || 0)}%</div>
          <div class="stat-label">Gesamtfortschritt</div>
        </div>
      </div>
    `;

    return section;
  }

  /**
   * Render category overview
   */
  renderCategoryOverview() {
    const section = document.createElement('section');
    section.className = 'category-overview';
    section.setAttribute('aria-labelledby', 'categories-heading');

    const categories = this.ihkContentService.getCategories();

    section.innerHTML = `
      <h2 id="categories-heading">Prüfungskatalog Übersicht</h2>
      <div class="categories-grid">
        ${categories
          .map(category => {
            const moduleCount = this.ihkContentService.getModulesByCategory(
              category.id
            ).length;
            const progress = this.examProgressService.getCategoryProgress(
              category.id
            );

            return `
            <article class="category-card" role="article">
              <div class="category-header">
                <h3>${category.id}: ${category.name}</h3>
                <span class="module-count">${moduleCount} Module</span>
              </div>
              <p class="category-description">${category.description}</p>
              <div class="progress-bar" role="progressbar" 
                   aria-valuenow="${progress}" 
                   aria-valuemin="0" 
                   aria-valuemax="100"
                   aria-label="Progress for ${category.name}">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
              <div class="category-actions">
                <button 
                  class="btn btn-secondary"
                  onclick="window.location.hash = '#/ihk/modules?category=${category.id}'"
                  aria-label="View modules for ${category.name}"
                >
                  Module ansehen
                </button>
              </div>
            </article>
          `;
          })
          .join('')}
      </div>
    `;

    return section;
  }

  /**
   * Handle filter changes
   */
  handleFilterChange(filters) {
    this.currentFilters = { ...this.currentFilters, ...filters };

    // Update search component with new filters
    if (this.searchComponent) {
      this.searchComponent.updateFilters(this.currentFilters);
    }

    accessibilityHelper.announce('Filters updated');
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

export default IHKOverviewView;
