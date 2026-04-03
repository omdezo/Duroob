/**
 * Duroob Analytics & Recommendation Engine
 *
 * All functions return mock data for now. Once the database layer
 * is connected, replace the mock returns with real Drizzle queries.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

interface PopularTierResult {
  tier: 'short' | 'medium' | 'long';
  percentage: number;
  totalTrips: number;
}

interface TrendingDestination {
  destinationId: string;
  name: string;
  changePercent: number;
}

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Returns the most popular trip-duration tier for a given duration
 * and what percentage of trips fall in that tier.
 */
// TODO: Replace with real DB query
export async function getPopularTier(
  duration: number,
): Promise<PopularTierResult> {
  return { tier: 'medium', percentage: 68, totalTrips: 342 };
}

/**
 * Returns the average daily cost (OMR) for trips of the given
 * duration, optionally filtered by region.
 */
// TODO: Replace with real DB query
export async function getAverageCost(
  duration: number,
  region?: string,
): Promise<number> {
  return 185;
}

/**
 * Returns the top trending destinations based on recent analytics
 * events, limited to `limit` results.
 */
// TODO: Replace with real DB query
export async function getTrending(
  limit: number,
): Promise<TrendingDestination[]> {
  return [
    { destinationId: 'mct-001', name: 'Sultan Qaboos Grand Mosque', changePercent: 24 },
    { destinationId: 'shq-001', name: 'Wahiba Sands', changePercent: 18 },
    { destinationId: 'dhf-001', name: 'Salalah Khareef Highlands', changePercent: 15 },
    { destinationId: 'dkh-002', name: 'Jebel Akhdar', changePercent: 12 },
    { destinationId: 'btn-001', name: 'Bimmah Sinkhole', changePercent: 9 },
  ].slice(0, limit);
}

/**
 * Returns what percentile a given score falls in compared to all
 * saved trips, for either safety or enjoyment score type.
 */
// TODO: Replace with real DB query
export async function getScorePercentile(
  score: number,
  type: 'safety' | 'enjoyment',
): Promise<number> {
  // Simple mock: clamp between 0-100 based on score magnitude
  return Math.min(100, Math.max(0, Math.round(score * 10)));
}

/**
 * Returns destination IDs that are frequently visited together
 * with the given destination.
 */
// TODO: Replace with real DB query
export async function getRelatedDestinations(
  destinationId: string,
): Promise<string[]> {
  const relatedMap: Record<string, string[]> = {
    'mct-001': ['mct-002', 'mct-005', 'mct-003'],
    'mct-002': ['mct-001', 'mct-005', 'mct-006'],
    'dkh-001': ['dkh-002', 'dkh-003', 'dkh-005'],
    'shq-001': ['shq-002', 'shq-005', 'dkh-004'],
    'dhf-001': ['dhf-002', 'dhf-004', 'dhf-006'],
  };

  return relatedMap[destinationId] ?? ['mct-001', 'dkh-001', 'shq-001'];
}
