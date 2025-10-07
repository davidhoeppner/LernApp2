import { tAssessment } from '../i18n/i18nAssessment.js';
import { emitEvent } from '../event/EventBus.js';
import A11yAnnouncer from '../a11y/A11yAnnouncer.js';

export default class FinalExamGate {
  constructor(container) {
    this.container = container;
    this.root = document.createElement('div');
    this.root.className = 'final-exam-gate';
  }

  render(status, unmetCriteria = []) {
    this.root.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = tAssessment('quiz.locked.title') || 'Final exam status';
    this.root.appendChild(title);

    if (status === 'LOCKED' || status === 'OUTDATED') {
      const list = document.createElement('ul');
      unmetCriteria.forEach(c => {
        const li = document.createElement('li');
        li.textContent = `${c.code} - ${c.id}`;
        list.appendChild(li);
      });
      this.root.appendChild(list);
    } else if (status === 'READY') {
      const btn = document.createElement('button');
      btn.textContent = 'Open Final Exam';
      btn.addEventListener('click', () => emitEvent('quiz.final.open', {}));
      this.root.appendChild(btn);
    } else if (status === 'COOLDOWN') {
      const msg = document.createElement('p');
      msg.textContent = tAssessment('quiz.cooldown.message');
      this.root.appendChild(msg);
    }
    this.container.appendChild(this.root);
  }

  destroy() {
    if (this.root.parentNode) this.root.parentNode.removeChild(this.root);
    try {
      A11yAnnouncer.destroy();
    } catch (e) {
      /* best-effort cleanup */
    }
  }
}
