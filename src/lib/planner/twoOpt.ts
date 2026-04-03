/**
 * 2-opt local search for route optimisation.
 *
 * Given an ordered list of destinations, repeatedly check whether reversing
 * any sub-sequence [i..j] reduces the total travel distance. Continues until
 * no improving swap is found (convergence guaranteed since distance is finite).
 *
 * Determinism guarantee:
 * - Iterates indices in fixed ascending order (i=0..n-2, j=i+2..n-1)
 * - Tie-breaks (equal distance) are NOT swapped → stable ordering preserved
 * - No randomness involved
 *
 * Complexity: O(n²) per pass, O(n³) worst-case. With max 5 stops/day this is
 * trivially fast (≤ 10 comparisons per pass).
 */

import type { Destination } from '@/types/destination';
import { totalKm } from './haversine';

function routeToLatLng(route: Destination[]) {
  return route.map(d => ({ lat: d.lat, lng: d.lng }));
}

/**
 * Apply a single 2-opt swap: reverse the sub-array from index i to j (inclusive).
 */
function twoOptSwap(route: Destination[], i: number, j: number): Destination[] {
  const result = [...route];
  // Reverse the segment [i, j]
  let left = i;
  let right = j;
  while (left < right) {
    [result[left], result[right]] = [result[right], result[left]];
    left++;
    right--;
  }
  return result;
}

/**
 * Run 2-opt until no improving swap exists.
 * Returns the improved route (or the original if already optimal).
 */
export function twoOptImprove(route: Destination[]): Destination[] {
  if (route.length <= 2) return route;

  let best = route;
  let bestDist = totalKm(routeToLatLng(best));
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 2; j < best.length; j++) {
        const candidate = twoOptSwap(best, i, j);
        const candidateDist = totalKm(routeToLatLng(candidate));
        // Only accept strictly improving swaps (no tie-breaking swap)
        if (candidateDist < bestDist - 1e-9) {
          best = candidate;
          bestDist = candidateDist;
          improved = true;
        }
      }
    }
  }

  return best;
}
