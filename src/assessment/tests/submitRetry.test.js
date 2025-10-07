import { describe, it, expect } from 'vitest';
import { AssessmentService } from '../services/AssessmentService.js';

class FailingStorage {
  constructor() {
    this.store = {};
  }
  get(k) {
    return this.store[k];
  }
  set(k, v) {
    throw new Error('disk full');
  }
}

class SuccessStorage {
  constructor() {
    this.store = {};
  }
  get(k) {
    return this.store[k];
  }
  set(k, v) {
    this.store[k] = v;
  }
}

describe('submitAttemptWithRetry', () => {
  it('saves when storage succeeds', async () => {
    const svc = new AssessmentService(undefined, new SuccessStorage());
    const res = await svc.submitAttemptWithRetry({ quizId: 'q1', id: 'a1' }, 1);
    expect(res.status).toBe('SAVED');
  });

  it('marks PENDING_SYNC when storage fails after retries', async () => {
    const svc = new AssessmentService(undefined, new FailingStorage());
    const res = await svc.submitAttemptWithRetry({ quizId: 'q2', id: 'a2' }, 1);
    expect(res.status).toBe('PENDING_SYNC');
  });
});
