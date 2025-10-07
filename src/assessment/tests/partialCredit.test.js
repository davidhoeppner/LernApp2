import { describe, it, expect } from 'vitest';
import { multiSelectPartial, roundHalfUp } from '../scoring/partialCredit.js';

describe('partial credit scoring', () => {
  it('full correct selection yields full credit', () => {
    const fraction = multiSelectPartial({
      selected: ['a', 'b'],
      correct: ['a', 'b'],
      totalOptions: 4,
    });
    expect(fraction).toBeGreaterThan(0.99);
  });

  it('incorrect extra selection reduces credit', () => {
    const fraction = multiSelectPartial({
      selected: ['a', 'b', 'x'],
      correct: ['a', 'b'],
      totalOptions: 4,
    });
    expect(fraction).toBeLessThan(1);
  });

  it('roundHalfUp rounds to 1 decimal half up', () => {
    expect(roundHalfUp(1.25, 1)).toBe(1.3);
    expect(roundHalfUp(1.24, 1)).toBe(1.2);
  });
});
