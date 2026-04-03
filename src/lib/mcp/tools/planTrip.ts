import type { McpContext, McpToolResult } from '../types';
import type { PlannerInputs } from '@/types/planner';
import type { BudgetTier, TravelIntensity } from '@/types/planner';
import type { Category, Region } from '@/types/destination';
import { generateItinerary } from '@/lib/planner/itineraryEngine';
import { scorePlan } from '@/lib/planner/tripScorer';

interface PlanTripInput {
  durationDays: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  budgetTier?: BudgetTier;
  customBudgetOmr?: number;
  travelMonth?: number;
  intensity?: TravelIntensity;
  preferredCategories?: Category[];
  preferredRegions?: Region[];
}

export function planTrip(input: PlanTripInput, ctx: McpContext): McpToolResult {
  const currentMonth = (new Date().getMonth() + 1) as PlannerInputs['travelMonth'];

  const plannerInputs: PlannerInputs = {
    durationDays: input.durationDays,
    budgetTier: input.budgetTier ?? 'medium',
    customBudgetOmr: input.customBudgetOmr,
    travelMonth: (input.travelMonth ?? currentMonth) as PlannerInputs['travelMonth'],
    intensity: input.intensity ?? 'balanced',
    preferredCategories: input.preferredCategories ?? [],
    preferredRegions: input.preferredRegions,
  };

  try {
    const plan = generateItinerary(plannerInputs);
    const scores = scorePlan(plan);
    return { plan, scores };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate itinerary';
    return { error: message };
  }
}
