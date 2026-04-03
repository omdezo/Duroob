/**
 * Budget-aware cost estimation and pruning.
 *
 * Formula:
 *   fuel    = totalKm / 12 * FUEL_PRICE_OMR
 *   tickets = Σ ticket_cost_omr
 *   food    = 6 OMR × days
 *   hotel   = hotelRate[tier] × (days - 1)   // nights = days - 1
 *
 * Budget thresholds (OMR) per tier:
 *   low:     150
 *   medium:  350
 *   luxury:  800
 *
 * If grandTotal > threshold:
 *   Replace highest-cost stops with cheaper alternatives (same region, overlapping categories).
 *   Re-run 2-opt on affected day. Repeat until within budget or no further reductions possible.
 */

import type { DayPlan, CostBreakdown, ScheduledStop } from '@/types/itinerary';
import type { BudgetTier, PlannerInputs } from '@/types/planner';
import { DESTINATIONS } from '@/data/destinations';
import { distanceKm, totalKm } from './haversine';
import { scoreDestination, topComponents } from './scoring';
import { twoOptImprove } from './twoOpt';

export const FUEL_PRICE_OMR = 0.18;       // OMR per litre
export const FUEL_CONSUMPTION_L_PER_100KM = 12;
export const FOOD_PER_DAY_OMR = 6;

export const HOTEL_RATES: Record<BudgetTier, number> = {
  low: 20,
  medium: 45,
  luxury: 90,
};

export const BUDGET_THRESHOLDS: Record<BudgetTier, number> = {
  low: 150,
  medium: 350,
  luxury: 800,
};

/** Compute cost breakdown from a set of day plans. */
export function estimateCost(days: DayPlan[], inputs: PlannerInputs): CostBreakdown {
  const totalKmVal = days.reduce((s, d) => s + d.totalKm, 0);
  const fuelOmr = (totalKmVal / 100) * FUEL_CONSUMPTION_L_PER_100KM * FUEL_PRICE_OMR;
  const ticketsOmr = days
    .flatMap(d => d.stops)
    .reduce((s, st) => s + st.destination.ticket_cost_omr, 0);
  const foodOmr = FOOD_PER_DAY_OMR * inputs.durationDays;
  const nights = Math.max(inputs.durationDays - 1, 0);
  const hotelOmr = HOTEL_RATES[inputs.budgetTier] * nights;
  const grandTotal = fuelOmr + ticketsOmr + foodOmr + hotelOmr;
  const threshold = inputs.customBudgetOmr ?? BUDGET_THRESHOLDS[inputs.budgetTier];

  return {
    fuelOmr: Math.round(fuelOmr * 100) / 100,
    ticketsOmr: Math.round(ticketsOmr * 100) / 100,
    foodOmr: Math.round(foodOmr * 100) / 100,
    hotelOmr: Math.round(hotelOmr * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    totalKm: Math.round(totalKmVal * 10) / 10,
    budgetTier: inputs.budgetTier,
    withinBudget: grandTotal <= threshold,
    budgetThreshold: threshold,
  };
}

/** Minutes-from-midnight → "HH:MM" */
function minutesToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Rebuild timestamps for a day's stops after a swap. */
function rebuildTimestamps(stops: ScheduledStop[], inputs: PlannerInputs): ScheduledStop[] {
  let clock = 8 * 60;
  return stops.map((st, i) => {
    let travelDist = 0;
    let travelMinutes = 0;
    if (i > 0) {
      const prev = stops[i - 1].destination;
      travelDist = distanceKm(
        { lat: prev.lat, lng: prev.lng },
        { lat: st.destination.lat, lng: st.destination.lng }
      );
      travelMinutes = Math.round((travelDist / 60) * 60);
      clock += travelMinutes;
    }
    const arrivalTime = minutesToTime(clock);
    clock += st.destination.avg_visit_duration_minutes;
    const departureTime = minutesToTime(clock);

    const scoredStop = scoreDestination(st.destination, {
      inputs,
      currentRoute: stops.slice(0, i).map(s => ({ lat: s.destination.lat, lng: s.destination.lng })),
      selectedSetToday: stops.slice(0, i).map(s => s.destination),
    });

    return {
      ...st,
      arrivalTime,
      departureTime,
      travelDistanceFromPrev: Math.round(travelDist * 10) / 10,
      travelTimeFromPrev: travelMinutes,
      scoreComponents: scoredStop.components,
      topTwoComponents: topComponents(scoredStop, 2),
    };
  });
}

/**
 * Prune or swap paid stops to bring the total cost within the budget threshold.
 * Preserves category coverage as much as possible.
 * Returns a modified copy of the day plans.
 */
export function pruneForBudget(days: DayPlan[], inputs: PlannerInputs): DayPlan[] {
  let current = days.map(d => ({ ...d, stops: [...d.stops] }));
  let cost = estimateCost(current, inputs);

  if (cost.withinBudget) return current;

  // Collect all paid stops across all days, sorted by cost descending (deterministic: tie-break by id)
  const paidStops = current
    .flatMap(day => day.stops.map(stop => ({ stop, day })))
    .filter(({ stop }) => stop.destination.ticket_cost_omr > 0)
    .sort(
      (a, b) =>
        b.stop.destination.ticket_cost_omr - a.stop.destination.ticket_cost_omr ||
        a.stop.destination.id.localeCompare(b.stop.destination.id)
    );

  const usedIds = new Set(current.flatMap(d => d.stops.map(s => s.destination.id)));

  for (const { stop, day } of paidStops) {
    if (cost.withinBudget) break;

    // Try to find a free/cheaper alternative in the same region with overlapping categories
    const alternatives = DESTINATIONS.filter(
      d =>
        d.region.en === day.region &&
        !usedIds.has(d.id) &&
        d.ticket_cost_omr < stop.destination.ticket_cost_omr &&
        d.categories.some(c => stop.destination.categories.includes(c))
    ).sort((a, b) => a.ticket_cost_omr - b.ticket_cost_omr || a.id.localeCompare(b.id));

    const dayRef = current.find(d => d.dayNumber === day.dayNumber)!;
    const stopIdx = dayRef.stops.findIndex(s => s.destination.id === stop.destination.id);

    if (alternatives.length > 0) {
      // Swap with best alternative
      const alt = alternatives[0];
      usedIds.delete(stop.destination.id);
      usedIds.add(alt.id);

      const dummyScore = scoreDestination(alt, {
        inputs,
        currentRoute: [],
        selectedSetToday: [],
      });
      dayRef.stops[stopIdx] = {
        ...stop,
        destination: alt,
        scoreComponents: dummyScore.components,
        topTwoComponents: topComponents(dummyScore, 2),
      };
    } else {
      // Remove the stop
      usedIds.delete(stop.destination.id);
      dayRef.stops.splice(stopIdx, 1);
    }

    // Re-optimise the affected day with 2-opt and rebuild timestamps
    const optimised = twoOptImprove(dayRef.stops.map(s => s.destination));
    const routeLatLng = optimised.map(d => ({ lat: d.lat, lng: d.lng }));
    dayRef.totalKm = Math.round(totalKm(routeLatLng) * 10) / 10;

    // Rebuild ScheduledStop objects
    const rebuiltStops = optimised.map(dest => {
      const existing = dayRef.stops.find(s => s.destination.id === dest.id)!;
      return existing;
    });
    dayRef.stops = rebuildTimestamps(rebuiltStops, inputs);

    cost = estimateCost(current, inputs);
  }

  return current;
}
