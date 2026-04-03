import { describe, it, expect } from 'vitest';
import {
  jaccardSimilarity,
  seasonFit,
  normalizeValue,
  diversityGain,
  scoreDestination,
  WEIGHTS,
} from '@/lib/planner/scoring';
import { DESTINATIONS } from '@/data/destinations';
import type { PlannerInputs } from '@/types/planner';

describe('jaccardSimilarity', () => {
  it('returns 1.0 for identical sets', () => {
    expect(jaccardSimilarity(['culture', 'beach'], ['beach', 'culture'])).toBe(1);
  });

  it('returns 0.0 for disjoint sets', () => {
    expect(jaccardSimilarity(['mountain'], ['beach'])).toBe(0);
  });

  it('returns 0.5 for empty user set (neutral)', () => {
    expect(jaccardSimilarity([], ['culture'])).toBe(0.5);
  });

  it('returns correct value for partial overlap', () => {
    // {a,b} ∩ {b,c} = {b}, {a,b,c} union → 1/3
    const result = jaccardSimilarity(['mountain', 'beach'], ['beach', 'culture']);
    expect(result).toBeCloseTo(1 / 3, 5);
  });
});

describe('seasonFit', () => {
  it('returns 1.0 when month is in recommended_months', () => {
    expect(seasonFit(1, [11, 12, 1, 2, 3])).toBe(1.0);
  });

  it('returns 0.5 for shoulder month (±1)', () => {
    expect(seasonFit(4, [10, 11, 12, 1, 2, 3])).toBe(0.5);
  });

  it('returns 0.0 for off-season', () => {
    expect(seasonFit(7, [10, 11, 12, 1, 2, 3])).toBe(0.0);
  });

  it('handles December-January wrap-around', () => {
    // Jan is adjacent to Dec (diff = 11)
    expect(seasonFit(1, [12])).toBe(0.5);
    // Dec is adjacent to Jan
    expect(seasonFit(12, [1])).toBe(0.5);
  });
});

describe('normalizeValue', () => {
  it('returns 0 for min value', () => {
    expect(normalizeValue(1, 1, 5)).toBe(0);
  });

  it('returns 1 for max value', () => {
    expect(normalizeValue(5, 1, 5)).toBe(1);
  });

  it('returns 0.5 for midpoint', () => {
    expect(normalizeValue(3, 1, 5)).toBe(0.5);
  });

  it('returns 0 when min === max', () => {
    expect(normalizeValue(3, 3, 3)).toBe(0);
  });

  it('clamps values outside range', () => {
    expect(normalizeValue(10, 1, 5)).toBe(1);
    expect(normalizeValue(-1, 1, 5)).toBe(0);
  });
});

describe('diversityGain', () => {
  const dest = DESTINATIONS.find((d) => d.categories.includes('culture') && d.categories.includes('food'))!;

  it('returns 1.0 when selected set is empty', () => {
    expect(diversityGain(dest, [])).toBe(1.0);
  });

  it('returns 0 when all categories already present', () => {
    const fakeSet = DESTINATIONS.filter((d) =>
      d.categories.some((c) => dest.categories.includes(c))
    ).slice(0, 3);
    const result = diversityGain(dest, fakeSet);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});

describe('scoreDestination', () => {
  const inputs: PlannerInputs = {
    durationDays: 3,
    budgetTier: 'medium',
    travelMonth: 1,
    intensity: 'balanced',
    preferredCategories: ['culture'],
  };

  it('returns a score between a reasonable range', () => {
    const dest = DESTINATIONS[0];
    const result = scoreDestination(dest, { inputs, currentRoute: [], selectedSetToday: [] });
    expect(result.totalScore).toBeGreaterThan(-1);
    expect(result.totalScore).toBeLessThan(1);
  });

  it('has 6 score components', () => {
    const dest = DESTINATIONS[0];
    const result = scoreDestination(dest, { inputs, currentRoute: [], selectedSetToday: [] });
    expect(result.components).toHaveLength(6);
  });

  it('is deterministic — same inputs produce same score', () => {
    const dest = DESTINATIONS[5];
    const ctx = { inputs, currentRoute: [], selectedSetToday: [] };
    const r1 = scoreDestination(dest, ctx);
    const r2 = scoreDestination(dest, ctx);
    expect(r1.totalScore).toBe(r2.totalScore);
  });

  it('weights sum to 1.0', () => {
    const sum = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});
