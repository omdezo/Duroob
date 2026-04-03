/**
 * Phase A: Region Allocation
 *
 * Allocates total trip days across regions to maximise utility while
 * enforcing diversity constraints. Entirely deterministic.
 */

import type { Destination, Region } from '@/types/destination';
import type { PlannerInputs, RegionAllocation } from '@/types/planner';
import { DESTINATIONS } from '@/data/destinations';
import { jaccardSimilarity, seasonFit } from './scoring';
import { distanceKm } from './haversine';

// Muscat is treated as the default gateway/start region
const GATEWAY_REGION: Region = 'muscat';

/** Compute the geographic centroid of a set of destinations. */
function centroid(destinations: Destination[]): { lat: number; lng: number } {
  const lat = destinations.reduce((s, d) => s + d.lat, 0) / destinations.length;
  const lng = destinations.reduce((s, d) => s + d.lng, 0) / destinations.length;
  return { lat, lng };
}

/**
 * Score a region for a given month and user category preferences.
 * Returns a value in [0, 1].
 */
function regionScore(
  dests: Destination[],
  inputs: PlannerInputs
): number {
  if (dests.length === 0) return 0;
  const avgInterest =
    dests.reduce((s, d) => s + jaccardSimilarity(inputs.preferredCategories, d.categories), 0) /
    dests.length;
  const avgSeason =
    dests.reduce((s, d) => s + seasonFit(inputs.travelMonth, d.recommended_months), 0) /
    dests.length;
  // Interest is weighted higher as the primary driver
  return 0.60 * avgInterest + 0.40 * avgSeason;
}

/**
 * Phase A entry point.
 * Returns an ordered list of RegionAllocation objects (day ranges assigned to regions).
 */
export function allocateRegions(inputs: PlannerInputs): RegionAllocation[] {
  const totalDays = inputs.durationDays;
  // If user explicitly requested a single region, give it ALL the days
  const singleRegionRequested = inputs.preferredRegions && inputs.preferredRegions.length === 1;
  const maxDaysPerRegion = singleRegionRequested ? totalDays : Math.ceil(totalDays / 2);

  // Group destinations by region, filtered by preferredRegions if set
  const regionMap = new Map<Region, Destination[]>();
  for (const d of DESTINATIONS) {
    const r = d.region.en;
    // If user specified preferred regions, only consider those
    if (inputs.preferredRegions && inputs.preferredRegions.length > 0) {
      if (!inputs.preferredRegions.includes(r)) continue;
    }
    if (!regionMap.has(r)) regionMap.set(r, []);
    regionMap.get(r)!.push(d);
  }

  // Score each region, sort descending. Tie-break by region name for determinism.
  const scored = [...regionMap.entries()]
    .map(([region, dests]) => ({
      region,
      score: regionScore(dests, inputs),
      dests,
    }))
    .sort((a, b) => b.score - a.score || a.region.localeCompare(b.region));

  // Greedy allocation with per-region cap
  const allocation: Array<{ region: Region; days: number; score: number }> = [];
  let remaining = totalDays;

  for (const { region, score, dests } of scored) {
    if (remaining <= 0) break;
    if (dests.length === 0) continue;
    const assign = Math.min(maxDaysPerRegion, remaining);
    allocation.push({ region, days: assign, score });
    remaining -= assign;
  }

  // Enforce: at least 2 regions visited when totalDays >= 3
  // BUT NOT if user explicitly requested a single region
  if (totalDays >= 3 && allocation.length === 1 && !singleRegionRequested) {
    const topRegion = allocation[0];
    // Steal 1 day from top region and give it to the second-ranked scored region
    // that is not already allocated
    const secondRegion = scored.find(s => s.region !== topRegion.region);
    if (secondRegion && topRegion.days > 1) {
      topRegion.days -= 1;
      allocation.push({ region: secondRegion.region, days: 1, score: secondRegion.score });
    }
  }

  // Order regions geographically to minimise inter-region travel.
  // Always start from the gateway (Muscat) if it's in the list.
  const orderedAlloc = orderRegionsGeographically(allocation, regionMap);

  // Assign sequential day ranges
  const result: RegionAllocation[] = [];
  let dayCursor = 1;
  for (const { region, days, score } of orderedAlloc) {
    result.push({
      region,
      startDay: dayCursor,
      endDay: dayCursor + days - 1,
      daysCount: days,
      regionScore: score,
    });
    dayCursor += days;
  }

  return result;
}

/**
 * Sort the allocation so that:
 * 1. Muscat (gateway) comes first if present.
 * 2. Subsequent regions are ordered by nearest-centroid to the previous region.
 * This is a simple nearest-neighbour ordering — deterministic (tie-break by name).
 */
function orderRegionsGeographically(
  allocation: Array<{ region: Region; days: number; score: number }>,
  regionMap: Map<Region, Destination[]>
): Array<{ region: Region; days: number; score: number }> {
  if (allocation.length <= 1) return allocation;

  const unvisited = [...allocation];
  const ordered: typeof allocation = [];

  // Start from Muscat if present, otherwise the highest-scored
  const gatewayIdx = unvisited.findIndex(a => a.region === GATEWAY_REGION);
  const startIdx = gatewayIdx >= 0 ? gatewayIdx : 0;
  ordered.push(...unvisited.splice(startIdx, 1));

  // Nearest-neighbour greedy from the last placed region
  while (unvisited.length > 0) {
    const lastRegion = ordered[ordered.length - 1].region;
    const lastDests = regionMap.get(lastRegion) ?? [];
    const lastCentroid = centroid(lastDests.length > 0 ? lastDests : [{ lat: 23.6, lng: 58.6 } as Destination]);

    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const dests = regionMap.get(unvisited[i].region) ?? [];
      if (dests.length === 0) continue;
      const c = centroid(dests);
      const d = distanceKm(lastCentroid, c);
      if (d < nearestDist || (d === nearestDist && unvisited[i].region < unvisited[nearestIdx].region)) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    ordered.push(...unvisited.splice(nearestIdx, 1));
  }

  return ordered;
}
