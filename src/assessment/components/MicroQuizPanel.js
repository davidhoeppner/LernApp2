import AssessmentService from '../services/AssessmentService.js';
import { emitEvent } from '../event/EventBus.js';
import { tAssessment } from '../i18n/i18nAssessment.js';
import A11yAnnouncer from '../a11y/A11yAnnouncer.js';

// Minimal MicroQuizPanel: renders into container, delegates scoring/submission
export default class MicroQuizPanel {
  constructor(container) {
    this.container = container;
    this.root = document.createElement('div');
    this.root.className = 'micro-quiz-panel';
  }

  render(quiz, moduleState = {}) {
    this.quiz = quiz;
    this.moduleState = moduleState;
    this.root.innerHTML = '';

    const header = document.createElement('h3');
    header.textContent = quiz.title || 'Micro-Quiz';
    this.root.appendChild(header);

    const form = document.createElement('form');
    form.className = 'micro-quiz-form';
    form.setAttribute('aria-labelledby', header.id || '');

    quiz.questions.slice(0, 5).forEach((q, idx) => {
      const fieldset = document.createElement('fieldset');
      const legend = document.createElement('legend');
      legend.textContent = q.question;
      fieldset.appendChild(legend);

      const opts = q.options || [];
      opts.forEach(opt => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = q.type === 'multiple-choice' ? 'checkbox' : 'radio';
        input.name = `q-${q.id}`;
        input.value = opt;
        label.appendChild(input);
        label.appendChild(document.createTextNode(opt));
        fieldset.appendChild(label);
      });
      form.appendChild(fieldset);
    });

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.textContent = tAssessment('quiz.submit.button') || 'Submit';
    submit.addEventListener('click', () => this._onSubmit(form));
    form.appendChild(submit);

    this.root.appendChild(form);
    this.container.appendChild(this.root);
    emitEvent('quiz.view', { quizId: quiz.id });
  }

  _gatherAnswers(form) {
    const answers = [];
    const qs = this.quiz.questions.slice(0, 5);
    qs.forEach(q => {
      const name = `q-${q.id}`;
      const inputs = Array.from(form.querySelectorAll(`[name="${name}"]`));
      if (q.type === 'multiple-choice') {
        const selected = inputs.filter(i => i.checked).map(i => i.value);
        answers.push({ questionId: q.id, selected });
      } else {
        const sel = inputs.find(i => i.checked);
        answers.push({ questionId: q.id, selected: sel ? sel.value : null });
      }
    });
    return answers;
  }

  async _onSubmit(form) {
    emitEvent('quiz.start', { quizId: this.quiz.id });
    const answers = this._gatherAnswers(form);
    const scoreResult = AssessmentService.scoreQuiz(this.quiz, answers);
    const attempt = {
      quizId: this.quiz.id,
      answers,
      score: scoreResult.finalScore,
      date: new Date().toISOString(),
    };
    // submit attempt with retry
    const res = await AssessmentService.submitAttemptWithRetry(attempt);
    // show or update results heading
    const headingSelector = '.quiz-results-heading';
    // Find all existing result headings inside this panel and normalize to at most one
    const existingHeadings = Array.from(
      this.root.querySelectorAll(headingSelector)
    );
    let heading = existingHeadings.length > 0 ? existingHeadings[0] : null;
    const qScores = scoreResult.questionScores || [];
    const earnedPoints = qScores.reduce(
      (s, q) => s + (Number.isFinite(q.score) ? q.score : 0),
      0
    );
    const totalPoints = (this.quiz.questions || []).reduce(
      (s, q) => s + (q.weight || 1) * 100,
      0
    );
    const percent =
      Number.isFinite(scoreResult.finalScore) &&
      !Number.isNaN(scoreResult.finalScore)
        ? scoreResult.finalScore
        : totalPoints > 0
          ? Number(((earnedPoints / totalPoints) * 100).toFixed(1))
          : 0;

    const text = `${tAssessment('quiz.result.label') || 'Result'}: ${percent}% (${Math.round(earnedPoints)}/${Math.round(totalPoints)} pts)`;
    if (heading) {
      // update existing heading text
      heading.textContent = text;
      // remove any duplicate headings beyond the first
      existingHeadings.slice(1).forEach(h => {
        if (h && h.parentNode) h.parentNode.removeChild(h);
      });
    } else {
      // create and insert the heading immediately after the form for predictable placement
      heading = document.createElement('h4');
      heading.className = 'quiz-results-heading';
      heading.tabIndex = -1;
      heading.textContent = text;
      const formEl = this.root.querySelector('form');
      if (formEl && formEl.parentNode)
        formEl.parentNode.insertBefore(heading, formEl.nextSibling);
      else this.root.appendChild(heading);
    }

    emitEvent('quiz.submit', {
      quizId: this.quiz.id,
      status: res.status,
      score: percent,
    });

    // Highlight correct and incorrect answers for each question and disable inputs
    try {
      this._highlightResults(scoreResult, form);
    } catch (err) {
      console.warn('Failed to highlight quiz results', err);
    }
  }

  _highlightResults(scoreResult, form) {
    if (!this.quiz || !form) return;
    const qs = this.quiz.questions.slice(0, 5);
    const qScoreMap =
      scoreResult && scoreResult.questionScores
        ? scoreResult.questionScores.reduce((m, q) => {
            m[q.questionId] = q.score;
            return m;
          }, {})
        : {};

    qs.forEach(q => {
      const name = `q-${q.id}`;
      const inputs = Array.from(form.querySelectorAll(`[name="${name}"]`));
      if (!inputs || inputs.length === 0) return;

      // Determine correct answers (support multiple field names)
      const correctField = q.correctAnswer ?? q.correct ?? q.answer;
      const correctArr = Array.isArray(correctField)
        ? correctField
        : correctField != null
          ? [correctField]
          : [];
      const correctSet = new Set(correctArr);

      // Determine if question was fully correct based on scoring (score === 100)
      const qScore = Number.isFinite(qScoreMap[q.id]) ? qScoreMap[q.id] : 0;
      const fullyCorrect = qScore >= 99.5;

      inputs.forEach(input => {
        // Find the label for this input (closest label or parent)
        let label = input.closest('label');
        if (!label) label = input.parentElement;

        const val = input.value;
        const isCorrectOption = correctSet.has(val);
        const isSelected = !!input.checked;

        // Clear any previous marker classes
        if (label) {
          label.classList.remove('correct-option', 'incorrect-selected');
        }

        // Mark correct options visually
        if (isCorrectOption) {
          if (label) label.classList.add('correct-option');
          // For screen reader clarity, mark aria-describedby
          input.setAttribute('data-correct', 'true');
          // add visible badge
          if (label && !label.querySelector('.result-badge')) {
            const b = document.createElement('span');
            b.className = 'result-badge correct-badge';
            b.textContent = 'Correct';
            label.appendChild(b);
          }
          // inline style fallback to guarantee visibility
          if (label) {
            label.style.backgroundColor = '#e6ffed';
            label.style.borderLeft = '4px solid #28a745';
            label.style.paddingLeft = '6px';
          }
        }

        // Mark incorrect selected options
        if (!isCorrectOption && isSelected) {
          if (label) label.classList.add('incorrect-selected');
          input.setAttribute('aria-invalid', 'true');
          if (label && !label.querySelector('.result-badge')) {
            const b = document.createElement('span');
            b.className = 'result-badge incorrect-badge';
            b.textContent = 'Incorrect';
            label.appendChild(b);
          }
          // inline style fallback
          if (label) {
            label.style.backgroundColor = '#fff0f0';
            label.style.borderLeft = '4px solid #d93025';
            label.style.paddingLeft = '6px';
          }
        }

        // Disable inputs to prevent changes after submit
        input.disabled = true;
      });

      // If the question was fully correct, add a small visually-hidden confirmation to the fieldset
      try {
        const fieldset = inputs[0] && inputs[0].closest('fieldset');
        if (fieldset) {
          // remove any existing result note or list
          const prevNote = fieldset.querySelector('.question-result-note');
          if (prevNote) prevNote.remove();
          const prevList = fieldset.querySelector('.correct-answers-list');
          if (prevList) prevList.remove();

          const note = document.createElement('div');
          note.className = 'question-result-note sr-only';
          note.textContent = fullyCorrect
            ? 'Question answered correctly'
            : 'Question has incorrect selections';
          fieldset.appendChild(note);

          // If not fully correct, show a visible list of correct answers
          if (!fullyCorrect && correctArr.length > 0) {
            const list = document.createElement('div');
            list.className = 'correct-answers-list';
            list.textContent = 'Correct answer(s): ' + correctArr.join(', ');
            fieldset.appendChild(list);
          }
        }
      } catch (e) {
        // ignore
      }
    });

    // mark panel as answered so styles/behaviors can target it
    try {
      this.root.classList.add('answered');
    } catch (e) {
      /* ignore */
    }
  }

  destroy() {
    if (this.root && this.root.parentNode)
      this.root.parentNode.removeChild(this.root);
    // ensure announcer is cleaned up when panel is removed
    try {
      A11yAnnouncer.destroy();
    } catch (e) {
      /* best-effort cleanup */
    }
  }
}
