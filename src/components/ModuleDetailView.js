/**
 * ModuleDetailView - Display module content with markdown rendering
 */
class ModuleDetailView {
  constructor(services, params) {
    this.moduleService = services.moduleService;
    this.quizService = services.quizService;
    this.ihkContentService = services.ihkContentService;
    this.router = services.router;
    this.moduleId = params.id;
    this.module = null;
    this.scrollProgress = 0;

    // Lazy load dependencies
    this.marked = null;
    this.hljs = null;
  }

  /**
   * Lazy load markdown and syntax highlighting libraries
   */
  async _loadDependencies() {
    if (!this.marked || !this.hljs) {
      const [markedModule, hljsModule] = await Promise.all([
        import('marked'),
        import('highlight.js'),
      ]);

      this.marked = markedModule.marked;
      this.hljs = hljsModule.default;

      // Configure marked
      this.marked.setOptions({
        highlight: (code, lang) => {
          if (lang && this.hljs.getLanguage(lang)) {
            try {
              return this.hljs.highlight(code, { language: lang }).value;
            } catch (err) {
              console.error('Highlight error:', err);
            }
          }
          return this.hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true,
      });
    }
  }

  /**
   * Render module detail view
   */
  async render() {
    const container = document.createElement('div');
    container.className = 'module-detail-view';
    container.id = 'main-content';
    container.setAttribute('role', 'main');
    container.setAttribute('aria-label', 'Module content');

    try {
      // Load dependencies and module data in parallel
      await Promise.all([
        this._loadDependencies(),
        this.moduleService.getModuleById(this.moduleId).then(module => {
          this.module = module;
        }),
      ]);

      container.innerHTML = `
        ${this._renderScrollProgress()}
        ${this._renderHeader()}
        <div class="module-detail-container">
          ${this._renderSidebar()}
          ${this._renderContent()}
        </div>
      `;

      this._attachEventListeners(container);
      this._generateTableOfContents(container);
      this._setupScrollTracking(container);
    } catch (error) {
      console.error('Error rendering module detail:', error);
      container.innerHTML = this._renderError(error.message);
    }

    return container;
  }

  /**
   * Render scroll progress indicator
   */
  _renderScrollProgress() {
    return `
      <div class="scroll-progress-bar" role="progressbar" aria-label="Reading progress" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
        <div class="scroll-progress-fill" style="width: 0%"></div>
      </div>
    `;
  }

  /**
   * Render module header
   */
  _renderHeader() {
    const statusBadge = this.module.completed
      ? '<span class="badge badge-success">✓ Completed</span>'
      : this.module.inProgress
        ? '<span class="badge badge-warning">In Progress</span>'
        : '<span class="badge badge-default">Not Started</span>';

    return `
      <header class="module-detail-header" role="banner">
        <button class="btn-ghost back-btn" data-action="back" aria-label="Go back to modules list">
          <span aria-hidden="true">←</span> Back to Modules
        </button>

        <div class="module-header-content">
          <div class="module-header-meta">
            <span class="module-category">${this.module.category || 'General'}</span>
            ${statusBadge}
          </div>

          <h1 class="module-detail-title">${this.module.title}</h1>
          <p class="module-detail-description">${this.module.description}</p>

          <div class="module-header-info" role="list">
            <div class="info-item" role="listitem">
              <span class="info-icon" aria-hidden="true">⏱️</span>
              <span><span class="sr-only">Duration: </span>${this.module.duration || 30} minutes</span>
            </div>
            ${this._renderPrerequisites()}
          </div>
        </div>
      </header>
    `;
  }

  /**
   * Render prerequisites
   */
  _renderPrerequisites() {
    if (!this.module.prerequisites || this.module.prerequisites.length === 0) {
      return '';
    }

    return `
      <div class="info-item" role="listitem">
        <span class="info-icon" aria-hidden="true">📋</span>
        <span>${this.module.prerequisites.length} prerequisite${this.module.prerequisites.length > 1 ? 's' : ''}</span>
      </div>
    `;
  }

  /**
   * Render sidebar with table of contents
   */
  _renderSidebar() {
    return `
      <aside class="module-sidebar" role="complementary" aria-label="Module navigation and actions">
        <div class="sidebar-sticky">
          <h2 class="sidebar-title">Table of Contents</h2>
          <nav class="table-of-contents" id="toc" aria-label="Table of contents">
            <!-- Generated dynamically -->
          </nav>

          <div class="sidebar-actions" role="group" aria-label="Module actions">
            <button class="btn-primary w-full" data-action="mark-complete" ${this.module.completed ? 'disabled' : ''} aria-label="${this.module.completed ? 'Module already completed' : 'Mark this module as complete'}">
              ${this.module.completed ? '✓ Completed' : 'Mark as Complete'}
            </button>
            <button class="btn-secondary w-full" data-action="view-quiz" aria-label="Take quiz for this module">
              Take Quiz <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </aside>
    `;
  }

  /**
   * Render module content
   */
  _renderContent() {
    const htmlContent = this.marked.parse(
      this.module.content || '# No content available'
    );

    return `
      <div class="module-content" role="region" aria-label="Module content">
        <article class="markdown-content">
          ${htmlContent}
        </article>
      </div>
    `;
  }

  /**
   * Render error state
   */
  _renderError(message) {
    return `
      <div class="error-state">
        <h2>Unable to load module</h2>
        <p>${message}</p>
        <button class="btn-primary" onclick="window.location.hash = '#/modules'">
          Back to Modules
        </button>
      </div>
    `;
  }

  /**
   * Generate table of contents from headings
   */
  _generateTableOfContents(container) {
    const content = container.querySelector('.markdown-content');
    const toc = container.querySelector('#toc');

    if (!content || !toc) return;

    const headings = content.querySelectorAll('h1, h2, h3');
    if (headings.length === 0) {
      toc.innerHTML = '<p class="toc-empty">No sections</p>';
      return;
    }

    const tocItems = Array.from(headings).map((heading, index) => {
      const id = `heading-${index}`;
      heading.id = id;

      const level = parseInt(heading.tagName.substring(1));
      const indent = level > 1 ? `toc-level-${level}` : '';

      return `
        <a href="#${id}" class="toc-item ${indent}" data-heading-id="${id}">
          ${heading.textContent}
        </a>
      `;
    });

    toc.innerHTML = tocItems.join('');

    // Add smooth scroll to TOC links
    toc.querySelectorAll('.toc-item').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const targetId = link.dataset.headingId;
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Update active TOC item
          this._updateActiveTocItem(targetId, container);
        }
      });
    });
  }

  /**
   * Setup scroll tracking
   */
  _setupScrollTracking(container) {
    const updateProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      const clampedPercent = Math.min(Math.max(scrollPercent, 0), 100);

      const progressBar = container.querySelector('.scroll-progress-bar');
      const progressFill = container.querySelector('.scroll-progress-fill');
      if (progressFill) {
        progressFill.style.width = `${clampedPercent}%`;
      }
      if (progressBar) {
        progressBar.setAttribute('aria-valuenow', Math.round(clampedPercent));
      }

      // Update active TOC item based on scroll position
      this._updateActiveTocItemOnScroll(container);
    };

    window.addEventListener('scroll', updateProgress);
    this.scrollHandler = updateProgress;
  }

  /**
   * Update active TOC item on scroll
   */
  _updateActiveTocItemOnScroll(container) {
    const headings = container.querySelectorAll(
      '.markdown-content [id^="heading-"]'
    );
    const tocItems = container.querySelectorAll('.toc-item');

    let activeId = null;
    const scrollPos = window.scrollY + 100;

    headings.forEach(heading => {
      if (heading.offsetTop <= scrollPos) {
        activeId = heading.id;
      }
    });

    tocItems.forEach(item => {
      if (item.dataset.headingId === activeId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Update active TOC item
   */
  _updateActiveTocItem(headingId, container) {
    const tocItems = container.querySelectorAll('.toc-item');
    tocItems.forEach(item => {
      if (item.dataset.headingId === headingId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners(container) {
    // Back button
    const backBtn = container.querySelector('[data-action="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.hash = '#/modules';
      });
    }

    // Mark as complete button
    const completeBtn = container.querySelector(
      '[data-action="mark-complete"]'
    );
    if (completeBtn && !this.module.completed) {
      completeBtn.addEventListener('click', async () => {
        try {
          await this.moduleService.markModuleComplete(this.moduleId);
          completeBtn.disabled = true;
          completeBtn.textContent = '✓ Completed';
          completeBtn.classList.add('btn-success');

          // Show success message
          this._showNotification('Module marked as complete! 🎉');
        } catch (error) {
          console.error('Error marking module complete:', error);
          this._showNotification('Failed to mark module as complete', 'error');
        }
      });
    }

    // View quiz button
    const quizBtn = container.querySelector('[data-action="view-quiz"]');
    if (quizBtn) {
      quizBtn.addEventListener('click', async () => {
        try {
          const quizzes = await this.ihkContentService.getAllQuizzes();
          const relatedQuiz = quizzes.find(q => q.moduleId === this.moduleId);

          if (relatedQuiz) {
            window.location.hash = `#/quizzes/${relatedQuiz.id}`;
          } else {
            this._showNotification(
              'No quiz available for this module',
              'warning'
            );
          }
        } catch (error) {
          console.error('Error loading quiz:', error);
          this._showNotification('Failed to load quiz', 'error');
        }
      });
    }
  }

  /**
   * Show notification (simple implementation)
   */
  _showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }
}

export default ModuleDetailView;
