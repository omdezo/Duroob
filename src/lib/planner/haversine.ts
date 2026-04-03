import type { LatLng } from '@/types/destination';

const EARTH_RADIUS_KM = 6371;

/** Haversine great-circle distance between two points (km). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Total sequential distance along an ordered route (km). */
export function totalKm(route: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    total += distanceKm(route[i - 1], route[i]);
  }
  return total;
}

/**
 * Minimum detour cost (km) of inserting a candidate stop into a route.
 * Returns the cheapest insertion cost across all positions.
 * If the route has 0 or 1 stops, detour is 0 (no extra distance incurred).
 */
export function detourKm(route: LatLng[], candidate: LatLng): number {
  if (route.length === 0) return 0;
  if (route.length === 1) return distanceKm(route[0], candidate);

  let minDetour = Infinity;
  for (let i = 0; i < route.length - 1; i++) {
    const insertionCost =
      distanceKm(route[i], candidate) +
      distanceKm(candidate, route[i + 1]) -
      distanceKm(route[i], route[i + 1]);
    if (insertionCost < minDetour) minDetour = insertionCost;
  }
  // Also check appending at the end
  const appendCost = distanceKm(route[route.length - 1], candidate);
  return Math.min(minDetour, appendCost);
}
