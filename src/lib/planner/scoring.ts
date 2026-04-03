/**
 * Multi-objective scoring model for itinerary candidate selection.
 *
 * score(i) =
 *   w_interest  * Jaccard(categories_user, categories_i)
 * + w_season    * SeasonFit(month, recommended_months_i)
 * - w_crowd     * Normalize(crowd_level_i)
 * - w_cost      * Normalize(ticket_cost_omr_i)
 * - w_detour    * DetourPenalty(i, current_route)
 * + w_diversity * DiversityGain(i, selected_set)
 *
 * All components normalized to [0, 1] before weighting.
 * Pure functions only — no hidden state, no randomness.
 */

import type { Category, Destination, LatLng } from '@/types/destination';
import type { PlannerInputs, ScoreComponent, ScoredCandidate } from '@/types/planner';
import { CROWD_MAX, CROWD_MIN, TICKET_COST_MAX, TICKET_COST_MIN } from '@/data/destinations';
import { detourKm } from './haversine';

// ─── Weight constants (documented) ─────────────────────────────────────────

export const WEIGHTS = {
  /**
   * Interest (0.30): User category affinity is the primary driver of satisfaction.
   * A destination that matches none of the user's categories should rank last.
   */
  interest: 0.30,
  /**
   * Season (0.25): Visiting in the wrong season causes severe experience degradation
   * (e.g. travelling to Salalah outside Khareef for the monsoon experience).
   */
  season: 0.25,
  /**
   * Crowd (0.15, penalty): Overcrowded sites reduce perceived quality. Applied as
   * a negative weight — the algorithm prefers less-crowded alternatives when scores
   * are otherwise equal.
   */
  crowd: 0.15,
  /**
   * Cost (0.10, penalty): Budget sensitivity. Lower than crowd/season so that great
   * destinations are not over-penalised purely for having an entry fee.
   */
  cost: 0.10,
  /**
   * Detour (0.10, penalty): Routing efficiency. Discourages geographically isolated
   * stops that add significant driving without proportional reward.
   */
  detour: 0.10,
  /**
   * Diversity (0.10): Rewards category variety within a day to prevent monotony.
   * (e.g. mixing culture + nature + food over back-to-back forts).
   */
  diversity: 0.10,
} as const;

// ─── Component functions ─────────────────────────────────────────────────────

/**
 * Jaccard similarity between two category sets.
 * Returns 0.5 (neutral) when the user provided no preferred categories.
 */
export function jaccardSimilarity(userCats: Category[], destCats: Category[]): number {
  if (userCats.length === 0) return 0.5;
  const setA = new Set(userCats);
  const setB = new Set(destCats);
  const intersection = [...setA].filter(c => setB.has(c)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Season fit score.
 * 1.0 → month is in recommended_months
 * 0.5 → month is within ±1 of any recommended month (shoulder season)
 * 0.0 → otherwise
 */
export function seasonFit(month: number, recommendedMonths: number[]): number {
  if (recommendedMonths.includes(month)) return 1.0;
  for (const rec of recommendedMonths) {
    const diff = Math.abs(month - rec);
    // Handle wrap-around (e.g. Jan=1 is adjacent to Dec=12)
    if (diff === 1 || diff === 11) return 0.5;
  }
  return 0.0;
}

/** Min-max normalisation to [0, 1]. Returns 0 when min === max. */
export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Detour penalty normalised by 250 km (max allowed daily distance).
 * First stop of a day returns 0 (no prior route context).
 */
export function detourPenalty(currentRoute: LatLng[], candidate: LatLng): number {
  const MAX_DAILY_KM = 250;
  if (currentRoute.length === 0) return 0;
  const km = detourKm(currentRoute, candidate);
  return Math.min(km / MAX_DAILY_KM, 1.0);
}

/**
 * Diversity gain: proportion of candidate's categories that are NEW
 * relative to the already-selected set for this day.
 */
export function diversityGain(candidate: Destination, selectedSet: Destination[]): number {
  if (selectedSet.length === 0) return 1.0;
  const existingCats = new Set(selectedSet.flatMap(d => d.categories));
  const newCats = candidate.categories.filter(c => !existingCats.has(c));
  return newCats.length / Math.max(candidate.categories.length, 1);
}

// ─── Main scoring function ───────────────────────────────────────────────────

interface ScoringContext {
  inputs: PlannerInputs;
  currentRoute: LatLng[];
  selectedSetToday: Destination[];
}

/**
 * Score a single destination candidate.
 * Returns a ScoredCandidate with all component values for the explanation panel.
 */
export function scoreDestination(
  candidate: Destination,
  ctx: ScoringContext
): ScoredCandidate {
  const interestVal = jaccardSimilarity(ctx.inputs.preferredCategories, candidate.categories);
  const seasonVal   = seasonFit(ctx.inputs.travelMonth, candidate.recommended_months);
  const crowdVal    = normalizeValue(candidate.crowd_level, CROWD_MIN, CROWD_MAX);
  const costVal     = normalizeValue(candidate.ticket_cost_omr, TICKET_COST_MIN, TICKET_COST_MAX);
  const detourVal   = detourPenalty(ctx.currentRoute, { lat: candidate.lat, lng: candidate.lng });
  const diversityVal = diversityGain(candidate, ctx.selectedSetToday);

  const components: ScoreComponent[] = [
    {
      name: 'interest',
      label: 'Category Match',
      value: interestVal,
      contribution: WEIGHTS.interest * interestVal,
    },
    {
      name: 'season',
      label: 'Season Fit',
      value: seasonVal,
      contribution: WEIGHTS.season * seasonVal,
    },
    {
      name: 'crowd',
      label: 'Low Crowd',
      value: 1 - crowdVal, // invert so higher = better for display
      contribution: -WEIGHTS.crowd * crowdVal,
    },
    {
      name: 'cost',
      label: 'Affordable',
      value: 1 - costVal, // invert for display
      contribution: -WEIGHTS.cost * costVal,
    },
    {
      name: 'detour',
      label: 'Route Efficiency',
      value: 1 - detourVal, // invert for display
      contribution: -WEIGHTS.detour * detourVal,
    },
    {
      name: 'diversity',
      label: 'Category Variety',
      value: diversityVal,
      contribution: WEIGHTS.diversity * diversityVal,
    },
  ];

  const totalScore = components.reduce((sum, c) => sum + c.contribution, 0);

  return {
    destinationId: candidate.id,
    totalScore,
    components,
  };
}

/**
 * Returns the top N components sorted by absolute contribution magnitude.
 * Used to populate the explanation panel ("why this stop was selected").
 */
export function topComponents(scored: ScoredCandidate, n = 2): ScoreComponent[] {
  return [...scored.components]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, n);
}
