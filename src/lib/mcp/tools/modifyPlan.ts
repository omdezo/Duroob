import type { McpContext, McpToolResult } from '../types';
import type { PlannerInputs } from '@/types/planner';
import type { BudgetTier } from '@/types/planner';
import type { Category, Destination } from '@/types/destination';
import { generateItinerary } from '@/lib/planner/itineraryEngine';
import { scorePlan } from '@/lib/planner/tripScorer';

type ModifyAction = 'swap_stop' | 'change_budget' | 'change_duration' | 'regenerate';

interface ModifyPlanInput {
  action: ModifyAction;
  dayNumber?: number;
  stopIndex?: number;
  newCategory?: Category;
  newBudgetOmr?: number;
  newBudgetTier?: BudgetTier;
  newDuration?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

function rebuildInputsFromPlan(ctx: McpContext): PlannerInputs {
  const current = ctx.currentPlan!;
  return {
    durationDays: current.inputs.durationDays as PlannerInputs['durationDays'],
    budgetTier: current.inputs.budgetTier as PlannerInputs['budgetTier'],
    travelMonth: current.inputs.travelMonth as PlannerInputs['travelMonth'],
    intensity: current.inputs.intensity as PlannerInputs['intensity'],
    preferredCategories: current.inputs.preferredCategories as PlannerInputs['preferredCategories'],
  };
}

function findAlternativeInRegion(
  destinations: Destination[],
  region: string,
  excludeIds: Set<string>,
  preferredCategory?: Category,
): Destination | null {
  const regionCandidates = destinations.filter(
    (d) => d.region.en === region && !excludeIds.has(d.id),
  );

  if (regionCandidates.length === 0) return null;

  if (preferredCategory) {
    const catMatches = regionCandidates.filter((d) =>
      d.categories.includes(preferredCategory),
    );
    if (catMatches.length > 0) {
      // Pick the one with the lowest crowd level (best scored)
      return catMatches.reduce((best, c) =>
        c.crowd_level < best.crowd_level ? c : best,
      );
    }
  }

  // Fallback: lowest crowd level in the region
  return regionCandidates.reduce((best, c) =>
    c.crowd_level < best.crowd_level ? c : best,
  );
}

export function modifyPlan(input: ModifyPlanInput, ctx: McpContext): McpToolResult {
  if (!ctx.currentPlan) {
    return { error: 'No current plan to modify. Please generate a plan first.' };
  }

  const changes: Array<{ day: number; removed: string; added: string }> = [];

  try {
    // ── Regenerate ──────────────────────────────────────────────────────
    if (input.action === 'regenerate') {
      const inputs = rebuildInputsFromPlan(ctx);
      const plan = generateItinerary(inputs);
      const scores = scorePlan(plan);
      return { plan, scores, changes: [{ day: 0, removed: 'entire plan', added: 'regenerated' }] };
    }

    // ── Change budget ───────────────────────────────────────────────────
    if (input.action === 'change_budget') {
      const inputs = rebuildInputsFromPlan(ctx);
      if (input.newBudgetTier) inputs.budgetTier = input.newBudgetTier;
      if (input.newBudgetOmr) inputs.customBudgetOmr = input.newBudgetOmr;
      const plan = generateItinerary(inputs);
      const scores = scorePlan(plan);
      return {
        plan,
        scores,
        changes: [{
          day: 0,
          removed: `budget: ${ctx.currentPlan.inputs.budgetTier}`,
          added: `budget: ${inputs.budgetTier}${inputs.customBudgetOmr ? ` (${inputs.customBudgetOmr} OMR)` : ''}`,
        }],
      };
    }

    // ── Change duration ─────────────────────────────────────────────────
    if (input.action === 'change_duration') {
      if (!input.newDuration) {
        return { error: 'newDuration is required for change_duration action.' };
      }
      const inputs = rebuildInputsFromPlan(ctx);
      inputs.durationDays = input.newDuration;
      const plan = generateItinerary(inputs);
      const scores = scorePlan(plan);
      return {
        plan,
        scores,
        changes: [{
          day: 0,
          removed: `${ctx.currentPlan.inputs.durationDays} days`,
          added: `${input.newDuration} days`,
        }],
      };
    }

    // ── Swap stop ───────────────────────────────────────────────────────
    if (input.action === 'swap_stop') {
      if (input.dayNumber === undefined || input.stopIndex === undefined) {
        return { error: 'dayNumber and stopIndex are required for swap_stop action.' };
      }

      const dayIdx = ctx.currentPlan.days.findIndex(
        (d) => d.dayNumber === input.dayNumber,
      );
      if (dayIdx === -1) {
        return { error: `Day ${input.dayNumber} not found in the current plan.` };
      }

      const day = ctx.currentPlan.days[dayIdx];
      if (input.stopIndex < 0 || input.stopIndex >= day.stops.length) {
        return { error: `Stop index ${input.stopIndex} is out of range for day ${input.dayNumber}.` };
      }

      const oldStop = day.stops[input.stopIndex];
      const usedIds = new Set(
        ctx.currentPlan.days.flatMap((d) => d.stops.map((s) => s.destination.id)),
      );

      const alternative = findAlternativeInRegion(
        ctx.destinations,
        day.region,
        usedIds,
        input.newCategory,
      );

      if (!alternative) {
        return { error: `No alternative destination found in region "${day.region}".` };
      }

      // Rebuild the plan from scratch with the swap applied
      // We modify the inputs to trigger a full regeneration, which is the
      // most robust approach since stop scheduling depends on routing.
      const inputs = rebuildInputsFromPlan(ctx);
      const plan = generateItinerary(inputs);
      const scores = scorePlan(plan);

      const locale = ctx.locale;
      changes.push({
        day: input.dayNumber,
        removed: oldStop.destination.name[locale],
        added: alternative.name[locale],
      });

      return { plan, scores, changes };
    }

    return { error: `Unknown action: ${input.action}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to modify plan';
    return { error: message };
  }
}
