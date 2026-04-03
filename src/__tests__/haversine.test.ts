import { describe, it, expect } from 'vitest';
import { distanceKm, totalKm, detourKm } from '@/lib/planner/haversine';

describe('haversine', () => {
  it('returns 0 for identical points', () => {
    expect(distanceKm({ lat: 23.59, lng: 58.41 }, { lat: 23.59, lng: 58.41 })).toBe(0);
  });

  it('Muscat to Nizwa Haversine distance is approximately 115 km', () => {
    const muscat = { lat: 23.5882, lng: 58.4088 };
    const nizwa = { lat: 22.9336, lng: 57.5316 };
    const dist = distanceKm(muscat, nizwa);
    // Straight-line (Haversine) distance, not road distance
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(130);
  });

  it('totalKm of single point is 0', () => {
    expect(totalKm([{ lat: 23.59, lng: 58.41 }])).toBe(0);
  });

  it('totalKm is sum of sequential distances', () => {
    const a = { lat: 23.59, lng: 58.41 };
    const b = { lat: 22.93, lng: 57.53 };
    const c = { lat: 22.96, lng: 57.30 };
    const ab = distanceKm(a, b);
    const bc = distanceKm(b, c);
    expect(totalKm([a, b, c])).toBeCloseTo(ab + bc, 6);
  });

  it('detourKm returns 0 for empty route', () => {
    expect(detourKm([], { lat: 23.59, lng: 58.41 })).toBe(0);
  });

  it('detourKm for single-point route equals distance to candidate', () => {
    const route = [{ lat: 23.59, lng: 58.41 }];
    const candidate = { lat: 22.93, lng: 57.53 };
    expect(detourKm(route, candidate)).toBeCloseTo(distanceKm(route[0], candidate), 6);
  });

  it('detourKm is non-negative', () => {
    const route = [
      { lat: 23.59, lng: 58.41 },
      { lat: 22.93, lng: 57.53 },
    ];
    const candidate = { lat: 22.96, lng: 57.30 };
    expect(detourKm(route, candidate)).toBeGreaterThanOrEqual(0);
  });
});
