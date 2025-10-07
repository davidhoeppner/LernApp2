// A11yAnnouncer creates a polite live region and listens for quiz.submit events to announce results (Req 7.6)
import { subscribe } from '../event/EventBus.js';
import { tAssessment } from '../i18n/i18nAssessment.js';

class A11yAnnouncer {
  constructor() {
    this.node = null;
    this._init();
    // subscribe returns an unsubscribe function in our EventBus contract
    this._unsub = subscribe('quiz.submit', this._onQuizSubmit.bind(this));
    // Clean up when the page unloads (single-page apps may handle differently)
    if (
      typeof window !== 'undefined' &&
      typeof window.addEventListener === 'function'
    ) {
      this._onUnload = this.destroy.bind(this);
      window.addEventListener('beforeunload', this._onUnload);
    }
  }

  _init() {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById('assessment-live-region');
    if (existing) {
      this.node = existing;
      return;
    }
    this.node = document.createElement('div');
    this.node.id = 'assessment-live-region';
    this.node.setAttribute('aria-live', 'polite');
    this.node.setAttribute('aria-atomic', 'true');
    // role=status is well-supported by screen readers for short, important messages
    this.node.setAttribute('role', 'status');
    // visually hide but keep accessible
    this.node.style.position = 'absolute';
    this.node.style.left = '-9999px';
    this.node.style.width = '1px';
    this.node.style.height = '1px';
    this.node.style.overflow = 'hidden';
    document.body.appendChild(this.node);
  }

  _onQuizSubmit(envelope) {
    const payload = (envelope && envelope.payload) || {};
    // Use i18n where available, but fall back to sensible English strings
    const savedKey = 'quiz.resultsAvailable';
    const pendingKey = 'quiz.submissionPending';
    let baseText = '';
    try {
      baseText =
        payload.status === 'SAVED'
          ? tAssessment(savedKey) || 'Quiz results available'
          : tAssessment(pendingKey) || 'Quiz submission pending';
    } catch (e) {
      // If i18n loader isn't present or throws, fallback
      baseText =
        payload.status === 'SAVED'
          ? 'Quiz results available'
          : 'Quiz submission pending';
    }

    // If a numeric score is available, include it in the announcement (e.g. "Score: 85%")
    let text = baseText;
    if (typeof payload.score === 'number') {
      // keep one decimal where relevant
      const scoreValue = Math.round(payload.score * 10) / 10;
      text = `${baseText} — Score: ${scoreValue}%`;
    }

    if (this.node) this.node.textContent = text;

    // Move focus to results heading if present; ensure it's programmatically focusable
    const heading = document.querySelector('.quiz-results-heading');
    if (heading) {
      if (!heading.hasAttribute('tabindex'))
        heading.setAttribute('tabindex', '-1');
      if (typeof heading.focus === 'function') heading.focus();
    }
  }

  // Remove live region and unsubscribe
  destroy() {
    try {
      if (this._unsub && typeof this._unsub === 'function') this._unsub();
      if (typeof window !== 'undefined' && this._onUnload)
        window.removeEventListener('beforeunload', this._onUnload);
      if (this.node && this.node.parentNode)
        this.node.parentNode.removeChild(this.node);
    } catch (e) {
      // swallow cleanup errors — announcer is best-effort

      console.warn('A11yAnnouncer cleanup error', e);
    } finally {
      this.node = null;
      this._unsub = null;
    }
  }
}

export default new A11yAnnouncer();
