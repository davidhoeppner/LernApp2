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
      try {
        const [markedModule, hljsModule] = await Promise.all([
          import('marked'),
          import('highlight.js'),
        ]);

        this.marked = markedModule.marked;
        this.hljs = hljsModule.default;

        // Configure marked
        this.marked.setOptions({
          highlight: (code, lang) => {
            if (lang && this.hljs.getLanguage && this.hljs.getLanguage(lang)) {
              try {
                return this.hljs.highlight(code, { language: lang }).value;
              } catch (err) {
                console.warn('Highlight error:', err);
              }
            }
            if (this.hljs && typeof this.hljs.highlightAuto === 'function') {
              return this.hljs.highlightAuto(code).value;
            }
            // last-resort: escape and wrap
            return this._escapeHtml(code);
          },
          breaks: true,
          gfm: true,
        });
      } catch (err) {
        // If imports fail (dev server hiccup, network), provide a tiny fallback parser
        // so the view can still render and inline micro-quiz hosts can be mounted.

        console.warn(
          'Failed to load markdown/highlight dependencies; using fallback parser',
          err
        );

        this.hljs = {
          getLanguage: () => false,
          highlightAuto: code => ({ value: this._escapeHtml(code) }),
        };

        // Minimal markdown fallback: headings, code fences, inline code, links, paragraphs
        this.marked = {
          parse: md => {
            if (!md) return '';
            // Basic escape
            let out = String(md);

            // Code fences ```lang\n...\n```
            out = out.replace(
              /```([a-zA-Z0-9-_]*)\n([\s\S]*?)```/g,
              (m, lang, code) => {
                return `<pre><code>${this._escapeHtml(code)}</code></pre>`;
              }
            );

            // Headings (#, ##, ###)
            out = out.replace(/^###\s*(.*)$/gm, '<h3>$1</h3>');
            out = out.replace(/^##\s*(.*)$/gm, '<h2>$1</h2>');
            out = out.replace(/^#\s*(.*)$/gm, '<h1>$1</h1>');

            // Inline code `code`
            out = out.replace(
              /`([^`]+)`/g,
              (m, code) => `<code>${this._escapeHtml(code)}</code>`
            );

            // Links [text](url)
            out = out.replace(
              /\[([^\]]+)\]\(([^)]+)\)/g,
              '<a href="$2">$1</a>'
            );

            // Paragraphs: split on two newlines
            const parts = out
              .split(/\n\s*\n/)
              .map(p => p.trim())
              .filter(Boolean);
            return parts.map(p => `<p>${p}</p>`).join('\n');
          },
        };
      }
    }
  }

  /**
   * Render module detail view
   */
  async render() {
    const container = document.createElement('div');
    container.className = 'module-detail-view';
    // NOTE: the application bootstrap already creates a <main id="main-content">.
    // Views should not create duplicate IDs. Keep this element as a plain view
    // container so it can be appended into the existing main container.
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
      // NOTE: Sidebar micro-quiz mounting intentionally disabled.
      // Microquizzes should only be mounted inline within module content
      // (see inline mounting logic further down in this file).
      this._generateTableOfContents(container);
      this._setupScrollTracking(container);
      // If no explicit inline markers are present but the module defines microQuizzes,
      // insert an inline host into the rendered markdown so users can answer questions
      // in-context (best-effort, non-destructive).
      try {
        const contentEl = container.querySelector('.markdown-content');
        if (
          contentEl &&
          this.module.microQuizzes &&
          this.module.microQuizzes.length > 0
        ) {
          const hasInline = contentEl.querySelector('.micro-quiz-inline');
          if (!hasInline) {
            const host = document.createElement('div');
            host.className = 'micro-quiz-inline';
            host.dataset.quizId = this.module.microQuizzes[0];

            // Prefer inserting after the first code block (<pre>), otherwise after first heading, otherwise append
            const afterNode =
              contentEl.querySelector('pre') ||
              contentEl.querySelector('h2') ||
              contentEl.querySelector('h3');
            if (afterNode && afterNode.parentNode) {
              afterNode.parentNode.insertBefore(host, afterNode.nextSibling);
            } else {
              contentEl.appendChild(host);
            }
          }
        }
      } catch (e) {
        // non-fatal
        console.warn('Failed to inject inline micro-quiz host', e);
      }
      // Mount inline micro-quiz panels within the content (markers: <!-- micro-quiz:quizId -->)
      try {
        const inlineHosts = container.querySelectorAll('.micro-quiz-inline');
        if (inlineHosts && inlineHosts.length > 0) {
          const { default: MicroQuizPanel } = await import(
            '../assessment/components/MicroQuizPanel.js'
          );
          this._inlineMicroQuizPanels = this._inlineMicroQuizPanels || [];
          for (const host of Array.from(inlineHosts)) {
            const quizId = host.dataset.quizId;
            if (!quizId) continue;
            let quizObj = null;
            try {
              // Primary resolution via content service
              quizObj = await this.ihkContentService.getQuizById(quizId);
            } catch (_) {
              // resolution failed; try fallback import below
              quizObj = null;
            }

            // Fallback: try dynamic import directly if content service couldn't resolve (best-effort)
            if (!quizObj) {
              try {
                // dynamic import relative to this module file
                const mod = await import(`../data/ihk/quizzes/${quizId}.json`);
                quizObj = mod && mod.default ? mod.default : mod;
              } catch (_) {
                quizObj = null;
              }
            }

            if (quizObj) {
              const panel = new MicroQuizPanel(host);
              panel.render(quizObj, {
                requiredSections: this.module.requiredSections || [],
              });
              this._inlineMicroQuizPanels.push(panel);
            } else {
              // unable to resolve this quiz id - continue without failing the view
              console.debug &&
                console.warn(
                  '[ModuleDetailView] unresolved micro-quiz id',
                  quizId
                );
            }
          }
        }
      } catch (e) {
        // best-effort: mounting inline quizzes should not break module rendering
        console.warn &&
          console.warn(
            'Failed to mount inline micro quizzes',
            e && e.message ? e.message : e
          );
      }
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
          <p class="module-detail-description">${this.formatInlineText(this.module.description)}</p>

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
   * Normalize content that may contain literal backslash-n sequences
   * and return a string suitable for markdown parsing.
   */
  _normalizeContent(text) {
    if (!text) return '';
    // Convert literal backslash-n and backslash-r\n sequences to real newlines
    return String(text)
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n');
  }

  /**
   * Format inline text fields (escape HTML and convert newlines to <br>)
   */
  formatInlineText(text) {
    if (!text) return '';
    const t = String(text).replace(/\\n/g, '\n');
    const escaped = this._escapeHtml(t);
    return escaped.replace(/\n/g, '<br>');
  }

  /**
   * Escape HTML (internal helper for ModuleDetailView)
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    const raw = this.module.content || '# No content available';
    const normalized = this._normalizeContent(raw);
    // Convert inline micro-quiz markers in the markdown into host divs
    // Marker syntax: <!-- micro-quiz:quizId -->
    const replaced = String(normalized).replace(
      /<!--\s*micro-quiz:([a-zA-Z0-9-_]+)\s*-->/g,
      (m, id) => {
        return `<div class="micro-quiz-inline" data-quiz-id="${id}"></div>`;
      }
    );

    const htmlContent = this.marked.parse(replaced);

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
    // Determine the appropriate scroll container. Prefer the nearest ancestor
    // that actually scrolls (overflow:auto/scroll and scrollHeight > clientHeight).
    const findScrollableAncestor = el => {
      let current = el;
      while (current && current !== document.documentElement) {
        try {
          const style = window.getComputedStyle(current);
          const overflowY = style.overflowY;
          if (
            (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
            current.scrollHeight > current.clientHeight
          ) {
            return current;
          }
        } catch (e) {
          // ignore cross-origin or computed style errors
        }
        current = current.parentElement;
      }

      // Fallback: if document.scrollingElement is available and differs from
      // document.documentElement use window scrolling as default.
      return window;
    };

    const scrollContainer = findScrollableAncestor(container);

    const updateProgress = () => {
      let scrollTop, scrollHeight, viewportHeight;
      if (scrollContainer === window) {
        viewportHeight = window.innerHeight;
        scrollHeight = document.documentElement.scrollHeight;
        scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      } else {
        viewportHeight = scrollContainer.clientHeight;
        scrollHeight = scrollContainer.scrollHeight;
        scrollTop = scrollContainer.scrollTop;
      }

      const denom = Math.max(scrollHeight - viewportHeight, 1);
      const scrollPercent = (scrollTop / denom) * 100;
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
      this._updateActiveTocItemOnScroll(container, scrollContainer);
    };

    // Attach listener to the determined scroll container and keep references
    if (scrollContainer === window) {
      window.addEventListener('scroll', updateProgress);
    } else {
      scrollContainer.addEventListener('scroll', updateProgress);
    }

    this.scrollHandler = updateProgress;
    this._scrollContainer = scrollContainer;
  }

  /**
   * Update active TOC item on scroll
   */
  _updateActiveTocItemOnScroll(container, scrollContainer = window) {
    const headings = container.querySelectorAll(
      '.markdown-content [id^="heading-"]'
    );
    const tocItems = container.querySelectorAll('.toc-item');

    let activeId = null;

    // Determine scroll offset reference depending on the scroll container
    const offsetRef = (el) => {
      const rect = el.getBoundingClientRect();
      if (scrollContainer === window) {
        return rect.top + window.scrollY;
      }
      // For an element scroll container, compute offset relative to the container's top
      const containerRect = scrollContainer.getBoundingClientRect();
      return rect.top - containerRect.top + scrollContainer.scrollTop;
    };

    const currentScroll =
      scrollContainer === window
        ? window.scrollY + 100
        : scrollContainer.scrollTop + 100;

    headings.forEach(heading => {
      const top = offsetRef(heading);
      if (top <= currentScroll) {
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
    try {
      if (this.scrollHandler) {
        if (this._scrollContainer && this._scrollContainer !== window) {
          this._scrollContainer.removeEventListener('scroll', this.scrollHandler);
        } else {
          window.removeEventListener('scroll', this.scrollHandler);
        }
      }
    } catch (e) {
      // swallow cleanup errors
    }
    // cleanup micro-quiz panel if mounted
    try {
      if (
        this._microQuizPanel &&
        typeof this._microQuizPanel.destroy === 'function'
      )
        this._microQuizPanel.destroy();
    } catch (e) {
      // swallow
    }
  }
}

export default ModuleDetailView;
