import { describe, it, expect } from 'vitest';
import {
  evaluateSectionReadable,
  evaluateFinalExamUnlock,
} from '../evaluators/gatingEvaluators.js';

describe('gating evaluators', () => {
  it('returns false for empty sectionProgress', () => {
    expect(evaluateSectionReadable(null)).toBe(false);
  });

  it('recognizes readRatio >= 0.85', () => {
    expect(evaluateSectionReadable({ readRatio: 0.85 })).toBe(true);
    expect(evaluateSectionReadable({ readRatio: 0.9 })).toBe(true);
  });

  it('locks final exam when unmet criteria present', () => {
    const moduleState = {
      requiredSections: ['s1'],
      sectionProgress: { s1: { readRatio: 0.5 } },
      microQuizzes: ['mq1'],
      microQuizState: { mq1: { passed: false } },
    };
    const result = evaluateFinalExamUnlock(moduleState);
    expect(result.status).toBe('LOCKED');
    expect(result.unmetCriteria.length).toBeGreaterThan(0);
  });

  it('marks OUTDATED when lastPassedSignature mismatches', () => {
    const moduleState = {
      requiredSections: [],
      sectionProgress: {},
      microQuizzes: [],
      microQuizState: {},
      finalExamPassed: true,
      structureSignature: 'v2',
      lastPassedSignature: 'v1',
    };
    const result = evaluateFinalExamUnlock(moduleState);
    expect(result.status).toBe('OUTDATED');
  });
});
