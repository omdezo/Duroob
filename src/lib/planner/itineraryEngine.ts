/**
 * Itinerary Engine — top-level orchestration entry point.
 *
 * Guaranteed deterministic: identical PlannerInputs always produce
 * identical ItineraryPlan output.
 *
 * Pipeline:
 *   Phase A → allocateRegions()
 *   Phase B → buildDayPlans()
 *   Budget  → pruneForBudget() if needed
 *   Cost    → estimateCost()
 */

import type { ItineraryPlan } from '@/types/itinerary';
import type { PlannerInputs } from '@/types/planner';
import { allocateRegions } from './regionAllocator';
import { buildDayPlans } from './intraRegionRouter';
import { pruneForBudget, estimateCost } from './budgetEstimator';

export function generateItinerary(inputs: PlannerInputs): ItineraryPlan {
  // Phase A: determine which regions to visit and for how many days
  const regionAllocation = allocateRegions(inputs);

  // Phase B: for each region block, build the day-by-day schedules
  const rawDays = buildDayPlans(regionAllocation, inputs);

  // Budget check and pruning
  const prunedDays = pruneForBudget(rawDays, inputs);

  // Final cost breakdown
  const costBreakdown = estimateCost(prunedDays, inputs);

  const totalKm = prunedDays.reduce((s, d) => s + d.totalKm, 0);

  return {
    regionAllocation,
    days: prunedDays,
    costBreakdown,
    totalKm: Math.round(totalKm * 10) / 10,
    inputs: {
      durationDays: inputs.durationDays,
      budgetTier: inputs.budgetTier,
      travelMonth: inputs.travelMonth,
      intensity: inputs.intensity,
      preferredCategories: inputs.preferredCategories,
    },
    generatedAt: new Date().toISOString(),
  };
}
