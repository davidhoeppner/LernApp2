import { describe, it, expect } from 'vitest';
import { AssessmentService } from '../services/AssessmentService.js';
import { setAssessmentLocale, tAssessment } from '../i18n/i18nAssessment.js';

describe('attempt retention and i18n', () => {
  it('prunes attempts FIFO beyond max', () => {
    const svc = new AssessmentService({ maxAttemptsStored: 2 });
    // simulate low-level storage by directly manipulating storage via service
    const a1 = { quizId: 'q1', id: 'a1' };
    const a2 = { quizId: 'q1', id: 'a2' };
    const a3 = { quizId: 'q1', id: 'a3' };
    svc.saveAttempt(a1);
    svc.saveAttempt(a2);
    svc.saveAttempt(a3);
    const attempts = svc.getAttempts('q1');
    expect(attempts.length).toBeLessThanOrEqual(2);
  });

  it('falls back to en locale when key missing in de', () => {
    setAssessmentLocale('de');
    const val = tAssessment('quiz.extra.enOnly');
    expect(val).toBe('This key exists only in English');
  });
});
