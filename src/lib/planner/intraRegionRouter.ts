/**
 * Phase B: Intra-Region Routing
 *
 * For each allocated region block, generates an ordered list of stops per day
 * that respects all hard constraints:
 *   - Max 250 km driving per day
 *   - Max 8 hours (480 min) visit time per day
 *   - Each day starts and ends in the same region
 *   - Category variety: max 2 same category per day (unless user chose only 1)
 *   - Rest gap: two stops >90 min cannot be adjacent without a <45 min stop between them
 *   - Intensity: relaxed=3 | balanced=4 | packed=5 stops/day
 *
 * Stop selection uses the multi-objective scoring model.
 * Route order is then optimised with 2-opt.
 */

import type { Destination, LatLng } from '@/types/destination';
import type { DayPlan, ScheduledStop } from '@/types/itinerary';
import type { PlannerInputs, RegionAllocation } from '@/types/planner';
import { DESTINATIONS } from '@/data/destinations';
import { distanceKm, totalKm } from './haversine';
import { scoreDestination, topComponents } from './scoring';
import { twoOptImprove } from './twoOpt';

export const MAX_DAILY_KM = 250;
export const MAX_DAILY_VISIT_MINUTES = 480; // 8 hours
const AVG_SPEED_KM_H = 60;
const LONG_STOP_THRESHOLD_MINUTES = 90;
const SHORT_STOP_THRESHOLD_MINUTES = 45;
const DAY_START_HOUR = 8; // 08:00

export const MAX_STOPS: Record<PlannerInputs['intensity'], number> = {
  relaxed: 3,
  balanced: 4,
  packed: 5,
};

/** Format minutes-from-midnight as "HH:MM". */
function minutesToTime(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60) % 24;
  const m = minutesFromMidnight % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Check the rest-gap constraint before adding a candidate.
 * Two consecutive long stops (>90 min) are only allowed if a short stop (<45 min)
 * sits between them.
 */
function violatesRestGap(selectedSoFar: Destination[], candidate: Destination): boolean {
  if (selectedSoFar.length === 0) return false;
  const last = selectedSoFar[selectedSoFar.length - 1];
  if (
    last.avg_visit_duration_minutes > LONG_STOP_THRESHOLD_MINUTES &&
    candidate.avg_visit_duration_minutes > LONG_STOP_THRESHOLD_MINUTES
  ) {
    // Need a short stop between them — violation
    return true;
  }
  return false;
}

/**
 * Check if adding a candidate exceeds the category-variety limit.
 * Max 2 same category per day unless user selected only 1 preferred category.
 */
function violatesCategoryLimit(
  selectedSoFar: Destination[],
  candidate: Destination,
  inputs: PlannerInputs
): boolean {
  if (inputs.preferredCategories.length === 1) return false;
  const catCount: Record<string, number> = {};
  for (const d of selectedSoFar) {
    for (const c of d.categories) {
      catCount[c] = (catCount[c] ?? 0) + 1;
    }
  }
  for (const c of candidate.categories) {
    if ((catCount[c] ?? 0) >= 2) return true;
  }
  return false;
}

/**
 * Build the day plans for a single region allocation block.
 */
function buildRegionDays(
  allocation: RegionAllocation,
  inputs: PlannerInputs,
  usedIds: Set<string>
): DayPlan[] {
  const regionDests = DESTINATIONS.filter(
    d => d.region.en === allocation.region && !usedIds.has(d.id)
  );

  const days: DayPlan[] = [];

  for (let dayOffset = 0; dayOffset < allocation.daysCount; dayOffset++) {
    const dayNumber = allocation.startDay + dayOffset;
    const maxStops = MAX_STOPS[inputs.intensity];
    const selectedStops: Destination[] = [];
    const currentRoute: LatLng[] = [];
    let runningVisitMinutes = 0;
    let runningKm = 0;

    // Candidate pool: region dests not yet used globally, sorted by id for determinism
    const available = regionDests
      .filter(d => !usedIds.has(d.id))
      .sort((a, b) => a.id.localeCompare(b.id));

    while (selectedStops.length < maxStops) {
      // Score all remaining candidates
      const scored = available
        .filter(d => !selectedStops.includes(d))
        .map(d => ({
          dest: d,
          scored: scoreDestination(d, {
            inputs,
            currentRoute,
            selectedSetToday: selectedStops,
          }),
        }))
        .sort((a, b) => b.scored.totalScore - a.scored.totalScore || a.dest.id.localeCompare(b.dest.id));

      let added = false;
      for (const { dest } of scored) {
        // Check hard constraints
        const travelFromLast =
          currentRoute.length > 0
            ? distanceKm(currentRoute[currentRoute.length - 1], { lat: dest.lat, lng: dest.lng })
            : 0;
        if (runningKm + travelFromLast > MAX_DAILY_KM) continue;
        if (runningVisitMinutes + dest.avg_visit_duration_minutes > MAX_DAILY_VISIT_MINUTES) continue;
        if (violatesRestGap(selectedStops, dest)) continue;
        if (violatesCategoryLimit(selectedStops, dest, inputs)) continue;

        selectedStops.push(dest);
        currentRoute.push({ lat: dest.lat, lng: dest.lng });
        runningVisitMinutes += dest.avg_visit_duration_minutes;
        runningKm += travelFromLast;
        usedIds.add(dest.id);
        added = true;
        break;
      }

      if (!added) break; // No valid candidate remains
    }

    if (selectedStops.length === 0) continue; // Skip empty days

    // Apply 2-opt optimisation on the day's stop order
    const optimisedStops = twoOptImprove(selectedStops);
    const optimisedRoute = optimisedStops.map(d => ({ lat: d.lat, lng: d.lng }));
    const optimisedKm = totalKm(optimisedRoute);

    // Build ScheduledStop list with timestamps
    const scheduledStops: ScheduledStop[] = [];
    let clock = DAY_START_HOUR * 60; // minutes since midnight

    for (let i = 0; i < optimisedStops.length; i++) {
      const dest = optimisedStops[i];
      let travelMinutes = 0;
      let travelDist = 0;

      if (i > 0) {
        const prev = optimisedStops[i - 1];
        travelDist = distanceKm({ lat: prev.lat, lng: prev.lng }, { lat: dest.lat, lng: dest.lng });
        travelMinutes = Math.round((travelDist / AVG_SPEED_KM_H) * 60);
        clock += travelMinutes;
      }

      const arrivalTime = minutesToTime(clock);
      clock += dest.avg_visit_duration_minutes;
      const departureTime = minutesToTime(clock);

      // Re-score to get explanation (deterministic, same inputs)
      const scoredStop = scoreDestination(dest, {
        inputs,
        currentRoute: optimisedRoute.slice(0, i),
        selectedSetToday: optimisedStops.slice(0, i),
      });
      const top2 = topComponents(scoredStop, 2);

      scheduledStops.push({
        destination: dest,
        arrivalTime,
        departureTime,
        travelDistanceFromPrev: Math.round(travelDist * 10) / 10,
        travelTimeFromPrev: travelMinutes,
        scoreComponents: scoredStop.components,
        topTwoComponents: top2,
      });
    }

    const firstRegionDest = DESTINATIONS.find(d => d.region.en === allocation.region);
    days.push({
      dayNumber,
      region: allocation.region,
      regionAr: firstRegionDest?.region.ar ?? allocation.region,
      stops: scheduledStops,
      totalKm: Math.round(optimisedKm * 10) / 10,
      totalVisitMinutes: scheduledStops.reduce((s, st) => s + st.destination.avg_visit_duration_minutes, 0),
      totalTravelMinutes: scheduledStops.reduce((s, st) => s + st.travelTimeFromPrev, 0),
    });
  }

  return days;
}

/**
 * Phase B entry point.
 * Builds all day plans across all region allocations.
 */
export function buildDayPlans(
  allocations: RegionAllocation[],
  inputs: PlannerInputs
): DayPlan[] {
  const usedIds = new Set<string>();
  const allDays: DayPlan[] = [];

  for (const allocation of allocations) {
    const days = buildRegionDays(allocation, inputs, usedIds);
    allDays.push(...days);
  }

  return allDays;
}
