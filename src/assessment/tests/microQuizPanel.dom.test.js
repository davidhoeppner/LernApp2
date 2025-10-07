// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import MicroQuizPanel from '../components/MicroQuizPanel.js';

describe('MicroQuizPanel DOM integration', () => {
  let container;

  beforeEach(() => {
    // fresh DOM container for each test
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('renders, submits, shows a single results heading and disables inputs with highlights', async () => {
    const quiz = {
      id: 'test-quiz-1',
      title: 'DOM Quiz',
      questions: [
        {
          id: 'q1',
          question: 'One plus one?',
          type: 'single-choice',
          options: ['1', '2', '3'],
          correctAnswer: '2',
          weight: 100,
        },
        {
          id: 'q2',
          question: 'Pick evens',
          type: 'multiple-choice',
          options: ['1', '2', '4'],
          correctAnswer: ['2', '4'],
          weight: 100,
        },
      ],
    };

    const panel = new MicroQuizPanel(container);
    panel.render(quiz, {});

    // simulate selecting wrong then correct answers
    const q1Inputs = Array.from(
      document.querySelectorAll('input[name="q-q1"]')
    );
    q1Inputs.find(i => i.value === '1').checked = true; // wrong

    const q2Inputs = Array.from(
      document.querySelectorAll('input[name="q-q2"]')
    );
    q2Inputs.find(i => i.value === '2').checked = true; // partially correct
    q2Inputs.find(i => i.value === '4').checked = false;

    // click submit twice to ensure only one heading exists and it updates
    const submit = document.querySelector('.micro-quiz-form button');
    expect(submit).toBeTruthy();
    submit.click();
    // wait a tick for async submission/score handling
    await new Promise(r => setTimeout(r, 20));

    submit.click();
    await new Promise(r => setTimeout(r, 20));

    const headings = document.querySelectorAll('.quiz-results-heading');
    expect(headings.length).toBe(1);

    // inputs should be disabled after submit
    const allInputs = Array.from(
      document.querySelectorAll('.micro-quiz-panel input')
    );
    expect(allInputs.every(i => i.disabled)).toBe(true);

    // check for at least one correct-option and one incorrect-selected class
    const corrects = document.querySelectorAll('.correct-option');
    const incorrects = document.querySelectorAll('.incorrect-selected');
    expect(corrects.length).toBeGreaterThan(0);
    expect(incorrects.length).toBeGreaterThan(0);
  });
});
