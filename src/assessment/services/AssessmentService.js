// AssessmentService (Req 7.*) manages quiz attempts, gating state, and score derivation.
import StorageService from '../../services/StorageService.js';
import { multiSelectPartial, roundHalfUp } from '../scoring/partialCredit.js';
import { emitEvent } from '../event/EventBus.js';
import { evaluateFinalExamUnlock } from '../evaluators/gatingEvaluators.js';

const ATTEMPTS_KEY = 'assessment.attempts.v1';
const PROGRESS_KEY = 'assessment.progress.v1';
const DRAFT_KEY = 'assessment.draft.v1';

export class AssessmentService {
  constructor(
    retentionPolicy = { maxAttemptsStored: 20, pruneStrategy: 'FIFO' },
    storageInstance = null
  ) {
    this.retentionPolicy = retentionPolicy;
    this.storage = storageInstance || new StorageService('assessment');
  }

  _safeGet(key, fallback) {
    try {
      const data = this.storage.get(key);
      return data || fallback;
    } catch (_) {
      return fallback;
    }
  }

  getAttempts(quizId) {
    const attempts = this._safeGet(ATTEMPTS_KEY, []);
    return attempts.filter(a => a.quizId === quizId);
  }

  saveAttempt(attempt) {
    const attempts = this._safeGet(ATTEMPTS_KEY, []);
    attempts.push(attempt);
    this._prune(attempts, attempt.quizId);
    this.storage.set(ATTEMPTS_KEY, attempts);
    emitEvent('quiz.attempt.save', {
      quizId: attempt.quizId,
      score: attempt.score,
    });
  }

  async submitAttemptWithRetry(attempt, maxRetries = 3) {
    let tries = 0;
    const backoffs = [1000, 3000, 7000];
    while (tries <= maxRetries) {
      try {
        // In this local-only implementation, attempt to save to storage directly so synchronous errors are caught
        const attempts = this._safeGet(ATTEMPTS_KEY, []);
        attempts.push({
          ...attempt,
          status: 'SAVED',
          savedAt: new Date().toISOString(),
        });
        this.storage.set(ATTEMPTS_KEY, attempts);
        emitEvent('quiz.submit', { quizId: attempt.quizId, status: 'SAVED' });
        return { status: 'SAVED' };
      } catch (err) {
        tries += 1;
        if (tries > maxRetries) {
          // Mark pending sync
          const pendingAttempt = {
            ...attempt,
            status: 'PENDING_SYNC',
            createdAt: new Date().toISOString(),
          };
          const attempts = this._safeGet(ATTEMPTS_KEY, []);
          attempts.push(pendingAttempt);
          try {
            this.storage.set(ATTEMPTS_KEY, attempts);
          } catch (e) {
            /* if set fails while marking pending, ignore to avoid throwing */
          }
          emitEvent('quiz.attempt.pending', { quizId: attempt.quizId });
          return { status: 'PENDING_SYNC' };
        }
        // exponential backoff pause
        const wait = backoffs[Math.min(tries - 1, backoffs.length - 1)];
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }

  _prune(allAttempts, quizId) {
    const quizAttempts = allAttempts.filter(a => a.quizId === quizId);
    if (quizAttempts.length > this.retentionPolicy.maxAttemptsStored) {
      const overflow =
        quizAttempts.length - this.retentionPolicy.maxAttemptsStored;
      // Remove oldest for this quiz
      let removed = 0;
      for (let i = 0; i < allAttempts.length && removed < overflow; i++) {
        if (allAttempts[i].quizId === quizId) {
          allAttempts.splice(i, 1);
          i--;
          removed++;
        }
      }
      emitEvent('quiz.attempt.pruned', { quizId, removed: overflow });
    }
  }

  scoreQuiz(quiz, answers) {
    // answers: { questionId: string, selected: string[]|string }
    let total = 0;
    let earned = 0;
    const questionScores = [];
    (quiz.questions || []).forEach(q => {
      const weight = typeof q.weight === 'number' ? q.weight : 1;
      total += weight * 100;
      const userAns = (answers || []).find(a => a.questionId === q.id);
      if (!userAns) {
        questionScores.push({ questionId: q.id, score: 0 });
        return;
      }
      let fraction = 0;
      // Support different JSON shapes: correctAnswer, correct, answer
      const correctField = q.correctAnswer ?? q.correct ?? q.answer;
      try {
        if (q.type === 'multiple-choice') {
          const selected = Array.isArray(userAns.selected)
            ? userAns.selected
            : userAns.selected
              ? [userAns.selected]
              : [];
          const correctArr = Array.isArray(correctField)
            ? correctField
            : correctField
              ? [correctField]
              : [];
          fraction = multiSelectPartial({
            selected,
            correct: correctArr,
            totalOptions: (q.options || []).length,
            weight: 1,
          });
        } else if (q.type === 'single-choice' || q.type === 'true-false') {
          const correctVal = Array.isArray(correctField)
            ? correctField[0]
            : correctField;
          fraction = userAns.selected === correctVal ? 1 : 0;
        } else {
          // Placeholder for ordering/gap fill future
          fraction = 0;
        }
      } catch (err) {
        // Defensive: if scoring helper throws (malformed quiz), treat as zero for that question
        fraction = 0;
        emitEvent('quiz.scoring.error', {
          quizId: quiz.id,
          questionId: q.id,
          error: String(err),
        });
      }
      const questionScore = Number.isFinite(fraction)
        ? Math.min(100, fraction * weight * 100)
        : 0;
      earned += questionScore;
      questionScores.push({ questionId: q.id, score: questionScore });
    });
    const rawPercent =
      total > 0 && Number.isFinite(earned) ? (earned / total) * 100 : 0;
    let finalScore = roundHalfUp(rawPercent, 1);
    if (!Number.isFinite(finalScore) || Number.isNaN(finalScore))
      finalScore = 0;
    return { finalScore, questionScores };
  }

  startDraft(quizId, data) {
    const drafts = this._safeGet(DRAFT_KEY, {});
    drafts[quizId] = { ...data, updatedAt: new Date().toISOString() };
    this.storage.set(DRAFT_KEY, drafts);
  }

  clearDraft(quizId) {
    const drafts = this._safeGet(DRAFT_KEY, {});
    delete drafts[quizId];
    this.storage.set(DRAFT_KEY, drafts);
  }

  getDraft(quizId) {
    const drafts = this._safeGet(DRAFT_KEY, {});
    return drafts[quizId] || null;
  }

  evaluateModule(moduleState) {
    return evaluateFinalExamUnlock(moduleState);
  }
}

export default new AssessmentService();
