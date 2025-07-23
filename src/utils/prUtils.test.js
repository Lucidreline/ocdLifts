import { describe, it, expect } from 'vitest';
import { isNewPR, calculatePerformanceScore } from './prUtils';

describe('calculatePerformanceScore', () => {
  it('calculates correctly for weighted exercise', () => {
    const set = { rep_count: 5, resistanceWeight: 20 };
    expect(calculatePerformanceScore(set)).toBe(100);
  });

  it('includes bodyweight if bodyweight exercise', () => {
    const set = { rep_count: 5, resistanceWeight: 10 };
    expect(calculatePerformanceScore(set, 150, true)).toBe(800); // (150+10)*5
  });

  it('ignores bodyweight if not flagged', () => {
    const set = { rep_count: 5, resistanceWeight: 10 };
    expect(calculatePerformanceScore(set, 150, false)).toBe(50);
  });
});

describe('isNewPR', () => {
  const prevSet = { rep_count: 5, resistanceWeight: 50 };
  const newSet = { rep_count: 6, resistanceWeight: 50 };

  it('detects PR from better performance', () => {
    expect(isNewPR(prevSet, newSet)).toBe(true);
  });

  it('respects bodyweight for bodyweight exercises', () => {
    const prev = { rep_count: 5, resistanceWeight: 0 };
    const next = { rep_count: 5, resistanceWeight: 10 };
    expect(isNewPR(prev, next, 150, true)).toBe(true); // 150 vs 160 per rep
  });

  it('does not flag if equal or worse', () => {
    expect(isNewPR(prevSet, prevSet)).toBe(false);
  });
});
