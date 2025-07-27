import { describe, it, expect } from 'vitest';
import { isNewPR, calculatePerformanceScore } from './prUtils';

describe('calculatePerformanceScore', () => {
  it('calculates correctly for weighted exercise', () => {
    const set = { rep_count: 5, resistanceWeight: 20 };
    expect(calculatePerformanceScore(set)).toBe(100);
  });

  it('treats 0 weight as 1 lb for scoring', () => {
    const set = { rep_count: 5, resistanceWeight: 0 };
    expect(calculatePerformanceScore(set)).toBe(5); // 5 * 1
  });

  it('treats missing weight as 1 lb for scoring', () => {
    const set = { rep_count: 5 };
    expect(calculatePerformanceScore(set)).toBe(5); // 5 * 1
  });
});

describe('isNewPR', () => {
  it('detects PR from better performance', () => {
    const prevSet = { rep_count: 5, resistanceWeight: 50 };
    const newSet = { rep_count: 6, resistanceWeight: 50 };
    expect(isNewPR(prevSet, newSet)).toBe(true);
  });

  it('does not flag as PR if equal performance', () => {
    const set = { rep_count: 5, resistanceWeight: 50 };
    expect(isNewPR(set, set)).toBe(false);
  });

  it('detects PR correctly when previous set has 0 weight', () => {
    const prevSet = { rep_count: 10, resistanceWeight: 0 }; // score: 10
    const newSet = { rep_count: 5, resistanceWeight: 3 };  // score: 15
    expect(isNewPR(prevSet, newSet)).toBe(true);
  });

  it('does not detect PR when new set has 0 weight and lower score', () => {
    const prevSet = { rep_count: 10, resistanceWeight: 3 }; // score: 30
    const newSet = { rep_count: 10, resistanceWeight: 0 };  // score: 10
    expect(isNewPR(prevSet, newSet)).toBe(false);
  });
});
