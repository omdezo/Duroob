import { describe, it, expect } from 'vitest';
import { twoOptImprove } from '@/lib/planner/twoOpt';
import { DESTINATIONS } from '@/data/destinations';
import { totalKm } from '@/lib/planner/haversine';

function routeToLatLng(route: typeof DESTINATIONS) {
  return route.map((d) => ({ lat: d.lat, lng: d.lng }));
}

describe('twoOptImprove', () => {
  it('returns the same route for 0 or 1 stops', () => {
    expect(twoOptImprove([])).toEqual([]);
    expect(twoOptImprove([DESTINATIONS[0]])).toEqual([DESTINATIONS[0]]);
  });

  it('result has same length as input', () => {
    const route = DESTINATIONS.slice(0, 5);
    const improved = twoOptImprove(route);
    expect(improved).toHaveLength(route.length);
  });

  it('result does not increase total distance', () => {
    const route = [
      DESTINATIONS.find((d) => d.id === 'mct-001')!,
      DESTINATIONS.find((d) => d.id === 'dhf-001')!,
      DESTINATIONS.find((d) => d.id === 'dkh-001')!,
      DESTINATIONS.find((d) => d.id === 'shq-001')!,
    ];
    const originalDist = totalKm(routeToLatLng(route));
    const improvedRoute = twoOptImprove(route);
    const improvedDist = totalKm(routeToLatLng(improvedRoute));
    expect(improvedDist).toBeLessThanOrEqual(originalDist + 1e-6);
  });

  it('is deterministic — same input produces same output', () => {
    const route = DESTINATIONS.slice(0, 5);
    const r1 = twoOptImprove(route);
    const r2 = twoOptImprove(route);
    expect(r1.map((d) => d.id)).toEqual(r2.map((d) => d.id));
  });

  it('contains the same destination IDs (no duplicates, no omissions)', () => {
    const route = DESTINATIONS.slice(0, 4);
    const improved = twoOptImprove(route);
    const inputIds = new Set(route.map((d) => d.id));
    const outputIds = new Set(improved.map((d) => d.id));
    expect(outputIds.size).toBe(inputIds.size);
    for (const id of inputIds) expect(outputIds.has(id)).toBe(true);
  });
});
