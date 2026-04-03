/**
 * Recommendations module — provides trending destinations and
 * context-aware suggestions based on season, region, and duration.
 *
 * Uses the static DESTINATIONS array. Will be enhanced with real
 * analytics data (view counts, bookings) once the database is wired up.
 */

import type { Destination, Region } from '@/types/destination';
import { DESTINATIONS } from '@/data/destinations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrendingDestination {
  destination: Destination;
  trendScore: number; // 0-100
  reason: string;
}

export interface Recommendation {
  destination: Destination;
  relevanceScore: number; // 0-100
  reason: string;
}

// ---------------------------------------------------------------------------
// Trending — mock implementation
// ---------------------------------------------------------------------------

/**
 * Returns a list of "trending" destinations. Currently uses a heuristic
 * based on crowd_level (higher = more popular) and season fit for the
 * current month. Will be replaced with real view/booking analytics.
 */
export function getTrendingDestinations(limit = 5): TrendingDestination[] {
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const scored = DESTINATIONS.map((d) => {
    const inSeason = d.recommended_months.includes(currentMonth as 1) ? 40 : 0;
    const popularity = (d.crowd_level / 5) * 40;
    const variety = (d.categories.length / 3) * 20;
    const trendScore = Math.round(inSeason + popularity + variety);

    return {
      destination: d,
      trendScore,
      reason: inSeason
        ? `Popular this month in ${d.region.en}`
        : `Top-rated in ${d.region.en}`,
    };
  });

  scored.sort((a, b) => b.trendScore - a.trendScore);

  return scored.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Context-aware recommendations
// ---------------------------------------------------------------------------

export function getRecommendations(options: {
  context?: string;
  duration?: number;
  region?: string;
}): Recommendation[] {
  const { context, duration, region } = options;
  let pool = [...DESTINATIONS];

  // Filter by region if provided
  if (region) {
    const regionLower = region.toLowerCase() as Region;
    pool = pool.filter((d) => d.region.en === regionLower);
  }

  const currentMonth = new Date().getMonth() + 1;

  const scored = pool.map((d) => {
    let relevanceScore = 0;

    // Season fit bonus
    if (d.recommended_months.includes(currentMonth as 1)) {
      relevanceScore += 30;
    }

    // Duration fit — shorter trips favour fewer high-impact stops
    if (duration) {
      if (duration <= 2 && d.crowd_level >= 4) {
        relevanceScore += 20; // iconic stops for short trips
      } else if (duration >= 5 && d.crowd_level <= 2) {
        relevanceScore += 20; // hidden gems for longer trips
      } else {
        relevanceScore += 10;
      }
    }

    // Text context matching (simple keyword match)
    if (context) {
      const keywords = context.toLowerCase().split(/\s+/);
      const haystack = [
        d.name.en.toLowerCase(),
        d.region.en.toLowerCase(),
        ...d.categories,
      ].join(' ');

      const matches = keywords.filter((kw) => haystack.includes(kw)).length;
      relevanceScore += Math.min(matches * 15, 40);
    }

    // Base quality score
    relevanceScore += (d.categories.length / 3) * 10;

    return {
      destination: d,
      relevanceScore: Math.min(Math.round(relevanceScore), 100),
      reason: buildReason(d, currentMonth, context),
    };
  });

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scored.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildReason(
  d: Destination,
  currentMonth: number,
  context?: string,
): string {
  const parts: string[] = [];
  if (d.recommended_months.includes(currentMonth as 1)) {
    parts.push('in season');
  }
  if (d.categories.length > 1) {
    parts.push(`offers ${d.categories.join(' & ')}`);
  }
  if (context) {
    parts.push(`matches "${context}"`);
  }
  return parts.length > 0
    ? parts.join(', ')
    : `Great destination in ${d.region.en}`;
}
