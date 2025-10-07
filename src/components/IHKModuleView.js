/**
 * IHK Module View Component
 * Displays detailed view of an IHK module with metadata, content, and code examples
 */

import accessibilityHelper from '../utils/AccessibilityHelper.js';

import EmptyState from './EmptyState.js';
import LoadingSpinner from './LoadingSpinner.js';
import toastNotification from './ToastNotification.js';

class IHKModuleView {
  constructor(services) {
    this.services = services;
    this.ihkContentService = services.ihkContentService;
    this.examProgressService = services.examProgressService;
    this.router = services.router;
    this.module = null;
  }

  /**
   * Render the module view
   */
  async render(moduleId) {
    const container = document.createElement('div');
    container.className = 'ihk-module-view';
    container.innerHTML = LoadingSpinner.render('Loading module...');

    // Load module asynchronously
    window.setTimeout(async () => {
      try {
        this.module = await this.ihkContentService.getModuleById(moduleId);

        if (!this.module) {
          const errorState = EmptyState.create({
            icon: '📚',
            title: 'Module Not Found',
            message: 'The requested module could not be found.',
            action: {
              label: 'Back to Overview',
              onClick: () => this.router.navigate('/'),
            },
          });
          container.innerHTML = '';
          container.appendChild(errorState);
          return;
        }

        container.innerHTML = '';
        container.appendChild(this.renderContent());
        accessibilityHelper.announce(`Module loaded: ${this.module.title}`);
      } catch (error) {
        console.error('Error loading module:', error);
        const errorState = EmptyState.create({
          icon: '⚠️',
          title: 'Error Loading Module',
          message: 'Failed to load module content. Please try again.',
          action: {
            label: 'Retry',
            onClick: () => this.render(moduleId),
          },
        });
        container.innerHTML = '';
        container.appendChild(errorState);
        toastNotification.error('Failed to load module');
      }
    }, 0);

    return container;
  }

  /**
   * Render the main content
   */
  renderContent() {
    const content = document.createElement('div');
    content.className = 'ihk-module-content';

    // Breadcrumb navigation
    const breadcrumb = this.renderBreadcrumb();
    content.appendChild(breadcrumb);

    // Module header with metadata
    const header = this.renderHeader();
    content.appendChild(header);

    // Module content
    const moduleContent = this.renderModuleContent();
    content.appendChild(moduleContent);

    // Code examples
    if (this.module.codeExamples && this.module.codeExamples.length > 0) {
      const codeExamples = this.renderCodeExamples();
      content.appendChild(codeExamples);
    }

    // Related content
    const related = this.renderRelatedContent();
    content.appendChild(related);

    // Action buttons
    const actions = this.renderActions();
    content.appendChild(actions);

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
        <li><a href="#/modules">Modules</a></li>
        <li><span aria-current="page">${this.module.title}</span></li>
      </ol>
    `;

    return nav;
  }

  /**
   * Render module header with metadata
   */
  renderHeader() {
    const header = document.createElement('header');
    header.className = 'module-header';

    const badges = [];
    if (this.module.newIn2025) {
      badges.push('<span class="badge badge-new">Neu 2025</span>');
    }
    if (this.module.removedIn2025) {
      badges.push(
        '<span class="badge badge-removed">Nicht mehr prüfungsrelevant</span>'
      );
    }
    if (this.module.important) {
      badges.push('<span class="badge badge-important">Wichtig</span>');
    }

    header.innerHTML = `
      <div class="module-badges">
        ${badges.join('')}
      </div>
      <h1>${this.module.title}</h1>
      <p class="module-description">${this.formatInlineText(this.module.description)}</p>
      <div class="module-metadata">
        <span class="meta-item">
          <strong>Kategorie:</strong> ${this.module.category}
        </span>
        <span class="meta-item">
          <strong>Schwierigkeit:</strong> 
          <span class="difficulty difficulty-${this.module.difficulty}">
            ${this.getDifficultyLabel(this.module.difficulty)}
          </span>
        </span>
        <span class="meta-item">
          <strong>Prüfungsrelevanz:</strong> 
          <span class="relevance relevance-${this.module.examRelevance}">
            ${this.getRelevanceLabel(this.module.examRelevance)}
          </span>
        </span>
        <span class="meta-item">
          <strong>Geschätzte Zeit:</strong> ${this.module.estimatedTime} Min.
        </span>
      </div>
      ${
        this.module.tags && this.module.tags.length > 0
          ? `
        <div class="module-tags">
          ${this.module.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      `
          : ''
      }
    `;

    return header;
  }

  /**
   * Format inline text fields (escape HTML and convert escaped/newline characters to <br>)
   */
  formatInlineText(text) {
    if (!text) return '';
    // First, convert literal backslash-n sequences into real newlines
    let t = String(text).replace(/\\n/g, '\n');
    // Escape HTML to avoid injection
    const escaped = this.escapeHtml(t);
    // Replace actual newlines with <br> for inline display
    return escaped.replace(/\n/g, '<br>');
  }

  /**
   * Render module content (markdown)
   */
  renderModuleContent() {
    const section = document.createElement('section');
    section.className = 'module-main-content';
    section.setAttribute('aria-labelledby', 'content-heading');

    // Convert markdown to HTML (simple implementation)
    const htmlContent = this.markdownToHtml(this.module.content);

    section.innerHTML = `
      <h2 id="content-heading" class="sr-only">Module Content</h2>
      <div class="content-body">
        ${htmlContent}
      </div>
    `;

    return section;
  }

  /**
   * Render code examples with syntax highlighting
   */
  renderCodeExamples() {
    const section = document.createElement('section');
    section.className = 'code-examples';
    section.setAttribute('aria-labelledby', 'code-examples-heading');

    section.innerHTML = `
      <h2 id="code-examples-heading">Code-Beispiele</h2>
      <div class="examples-container">
        ${this.module.codeExamples
          .map(
            (example, index) => `
          <article class="code-example" role="article">
            <h3>${example.title || `Beispiel ${index + 1}`}</h3>
            ${example.explanation ? `<p class="example-explanation">${example.explanation}</p>` : ''}
            <div class="code-block-wrapper">
              <div class="code-header">
                <span class="language-label">${example.language.toUpperCase()}</span>
                <button 
                  class="btn-copy" 
                  onclick="navigator.clipboard.writeText(${JSON.stringify(example.code).replace(/"/g, '&quot;')}).then(() => {
                    this.textContent = 'Copied!';
                    setTimeout(() => this.textContent = 'Copy', 2000);
                  })"
                  aria-label="Copy code to clipboard"
                >
                  Copy
                </button>
              </div>
              <pre><code class="language-${example.language}">${this.escapeHtml(example.code)}</code></pre>
            </div>
          </article>
        `
          )
          .join('')}
      </div>
    `;

    return section;
  }

  /**
   * Render related content (quizzes and modules)
   */
  renderRelatedContent() {
    const section = document.createElement('section');
    section.className = 'related-content';
    section.setAttribute('aria-labelledby', 'related-heading');

    const relatedQuizzes = this.ihkContentService.getRelatedQuizzes(
      this.module.id
    );
    const relatedModules = this.ihkContentService.getRelatedModules(
      this.module.id
    );

    section.innerHTML = `
      <h2 id="related-heading">Verwandte Inhalte</h2>
      
      ${
        relatedQuizzes.length > 0
          ? `
        <div class="related-section">
          <h3>Quizzes</h3>
          <ul class="related-list">
            ${relatedQuizzes
              .map(
                quiz => `
              <li>
                <a href="#/quizzes/${quiz.id}" class="related-link">
                  <span class="link-icon">📝</span>
                  <span class="link-text">${quiz.title}</span>
                  <span class="link-meta">${quiz.questions?.length || 0} Fragen</span>
                </a>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
          : ''
      }

      ${
        relatedModules.length > 0
          ? `
        <div class="related-section">
          <h3>Verwandte Module</h3>
          <ul class="related-list">
            ${relatedModules
              .map(
                module => `
              <li>
                <a href="#/modules/${module.id}" class="related-link">
                  <span class="link-icon">📚</span>
                  <span class="link-text">${module.title}</span>
                  <span class="link-meta">${module.estimatedTime} Min.</span>
                </a>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
          : ''
      }

      ${
        relatedQuizzes.length === 0 && relatedModules.length === 0
          ? `
        <p class="no-related">Keine verwandten Inhalte verfügbar.</p>
      `
          : ''
      }
    `;

    return section;
  }

  /**
   * Render action buttons
   */
  renderActions() {
    const actions = document.createElement('div');
    actions.className = 'module-actions';

    const isCompleted = this.examProgressService.isModuleCompleted(
      this.module.id
    );

    actions.innerHTML = `
      <button 
        class="btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}"
        onclick="window.ihkModuleView.toggleComplete()"
        aria-pressed="${isCompleted}"
      >
        ${isCompleted ? '✓ Als abgeschlossen markiert' : 'Als abgeschlossen markieren'}
      </button>
      <button 
        class="btn btn-secondary"
        onclick="window.location.hash = '#/ihk/modules'"
      >
        Zurück zur Übersicht
      </button>
    `;

    // Store reference for button handler
    window.ihkModuleView = this;

    return actions;
  }

  /**
   * Toggle module completion status
   */
  toggleComplete() {
    const isCompleted = this.examProgressService.isModuleCompleted(
      this.module.id
    );

    if (isCompleted) {
      this.examProgressService.markModuleIncomplete(this.module.id);
      toastNotification.info('Module als unvollständig markiert');
    } else {
      this.examProgressService.markModuleComplete(this.module.id);
      toastNotification.success('Module abgeschlossen!');
    }

    // Re-render actions
    const actionsEl = document.querySelector('.module-actions');
    if (actionsEl) {
      const newActions = this.renderActions();
      actionsEl.replaceWith(newActions);
    }
  }

  /**
   * Simple markdown to HTML converter
   */
  markdownToHtml(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // First, convert escaped newlines to actual newlines
    html = html.replace(/\\n/g, '\n');

    // Code blocks (must be processed before other formatting)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers (must be processed before bold/italic)
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold (must be before italic)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Links
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Unordered lists
    const lines = html.split('\n');
    let inList = false;
    let processedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isListItem = /^- (.+)/.test(line);

      if (isListItem) {
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        processedLines.push(line.replace(/^- (.+)/, '<li>$1</li>'));
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(line);
      }
    }

    if (inList) {
      processedLines.push('</ul>');
    }

    html = processedLines.join('\n');

    // Paragraphs (split by double newlines)
    const blocks = html.split('\n\n');
    html = blocks
      .map(block => {
        block = block.trim();
        // Don't wrap if already wrapped in HTML tags
        if (
          block.startsWith('<h') ||
          block.startsWith('<ul') ||
          block.startsWith('<pre') ||
          block.startsWith('<code') ||
          block === ''
        ) {
          return block;
        }
        return `<p>${block.replace(/\n/g, '<br>')}</p>`;
      })
      .join('\n');

    return html;
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
   * Get relevance label
   */
  getRelevanceLabel(relevance) {
    const labels = {
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig',
    };
    return labels[relevance] || relevance;
  }
}

export default IHKModuleView;
