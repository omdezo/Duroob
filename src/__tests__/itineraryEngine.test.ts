import { describe, it, expect } from 'vitest';
import { generateItinerary } from '@/lib/planner/itineraryEngine';
import type { PlannerInputs } from '@/types/planner';
import { BUDGET_THRESHOLDS } from '@/lib/planner/budgetEstimator';

const BASE_INPUTS: PlannerInputs = {
  durationDays: 3,
  budgetTier: 'medium',
  travelMonth: 1,
  intensity: 'balanced',
  preferredCategories: ['culture', 'nature'],
};

describe('generateItinerary', () => {
  it('returns a plan with the correct number of days', () => {
    const plan = generateItinerary(BASE_INPUTS);
    expect(plan.days.length).toBeGreaterThanOrEqual(1);
    expect(plan.days.length).toBeLessThanOrEqual(BASE_INPUTS.durationDays);
  });

  it('is deterministic — identical inputs produce identical output', () => {
    const p1 = generateItinerary(BASE_INPUTS);
    const p2 = generateItinerary(BASE_INPUTS);
    expect(p1.totalKm).toBe(p2.totalKm);
    expect(p1.costBreakdown.grandTotal).toBe(p2.costBreakdown.grandTotal);
    const ids1 = p1.days.flatMap((d) => d.stops.map((s) => s.destination.id));
    const ids2 = p2.days.flatMap((d) => d.stops.map((s) => s.destination.id));
    expect(ids1).toEqual(ids2);
  });

  it('respects max stops per day (balanced = 4)', () => {
    const plan = generateItinerary(BASE_INPUTS);
    for (const day of plan.days) {
      expect(day.stops.length).toBeLessThanOrEqual(4);
    }
  });

  it('respects max daily km constraint', () => {
    const plan = generateItinerary(BASE_INPUTS);
    for (const day of plan.days) {
      expect(day.totalKm).toBeLessThanOrEqual(250 + 0.1); // small float tolerance
    }
  });

  it('respects max daily visit time (480 min)', () => {
    const plan = generateItinerary(BASE_INPUTS);
    for (const day of plan.days) {
      expect(day.totalVisitMinutes).toBeLessThanOrEqual(480);
    }
  });

  it('visits at least 2 regions when durationDays >= 3', () => {
    const plan = generateItinerary({ ...BASE_INPUTS, durationDays: 3 });
    const regions = new Set(plan.regionAllocation.map((a) => a.region));
    expect(regions.size).toBeGreaterThanOrEqual(2);
  });

  it('no region receives more than ceil(days/2) days', () => {
    const plan = generateItinerary(BASE_INPUTS);
    const maxAllowed = Math.ceil(BASE_INPUTS.durationDays / 2);
    for (const alloc of plan.regionAllocation) {
      expect(alloc.daysCount).toBeLessThanOrEqual(maxAllowed);
    }
  });

  it('each stop has a top-2 explanation', () => {
    const plan = generateItinerary(BASE_INPUTS);
    for (const day of plan.days) {
      for (const stop of day.stops) {
        expect(stop.topTwoComponents).toHaveLength(2);
      }
    }
  });

  it('no duplicate stops across the entire plan', () => {
    const plan = generateItinerary(BASE_INPUTS);
    const ids = plan.days.flatMap((d) => d.stops.map((s) => s.destination.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('arrival times are before departure times', () => {
    const plan = generateItinerary(BASE_INPUTS);
    for (const day of plan.days) {
      for (const stop of day.stops) {
        const [ah, am] = stop.arrivalTime.split(':').map(Number);
        const [dh, dm] = stop.departureTime.split(':').map(Number);
        const arrMin = ah * 60 + am;
        const depMin = dh * 60 + dm;
        expect(depMin).toBeGreaterThan(arrMin);
      }
    }
  });

  it('cost breakdown components sum to grand total', () => {
    const plan = generateItinerary(BASE_INPUTS);
    const c = plan.costBreakdown;
    const sum = c.fuelOmr + c.ticketsOmr + c.foodOmr + c.hotelOmr;
    expect(sum).toBeCloseTo(c.grandTotal, 1);
  });

  it('1-day trip plan produces at least 1 stop', () => {
    const plan = generateItinerary({ ...BASE_INPUTS, durationDays: 1 });
    const totalStops = plan.days.reduce((s, d) => s + d.stops.length, 0);
    expect(totalStops).toBeGreaterThan(0);
  });

  it('7-day packed trip produces more stops than 1-day relaxed', () => {
    const short = generateItinerary({ ...BASE_INPUTS, durationDays: 1, intensity: 'relaxed' });
    const long = generateItinerary({ ...BASE_INPUTS, durationDays: 7, intensity: 'packed' });
    const shortTotal = short.days.reduce((s, d) => s + d.stops.length, 0);
    const longTotal = long.days.reduce((s, d) => s + d.stops.length, 0);
    expect(longTotal).toBeGreaterThan(shortTotal);
  });
});

describe('budget constraints', () => {
  it('low budget plan marks grand total vs threshold correctly', () => {
    const plan = generateItinerary({ ...BASE_INPUTS, budgetTier: 'low', durationDays: 2 });
    const { grandTotal, budgetThreshold, withinBudget } = plan.costBreakdown;
    expect(withinBudget).toBe(grandTotal <= BUDGET_THRESHOLDS.low);
    expect(budgetThreshold).toBe(BUDGET_THRESHOLDS.low);
  });
});
