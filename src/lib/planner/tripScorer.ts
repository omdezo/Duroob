import type { ItineraryPlan, ScheduledStop } from '@/types/itinerary';

export interface TripScores {
  safety: number;          // 0-100
  enjoyment: number;       // 0-100
  costEfficiency: number;  // 0-100
  overall: 'excellent' | 'good' | 'fair';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function allStops(plan: ItineraryPlan): ScheduledStop[] {
  return plan.days.flatMap((d) => d.stops);
}

// ---------------------------------------------------------------------------
// Safety sub-scores (each 0-100)
// ---------------------------------------------------------------------------

/** 25 % — lower crowd levels are safer */
function crowdAvoidance(stops: ScheduledStop[]): number {
  if (stops.length === 0) return 100;
  const avg =
    stops.reduce((sum, s) => sum + s.destination.crowd_level, 0) /
    stops.length;
  return (1 - avg / 5) * 100;
}

/** 25 % — % of stops visited during a recommended month */
function seasonFit(stops: ScheduledStop[], travelMonth: number): number {
  if (stops.length === 0) return 100;
  const inSeason = stops.filter((s) =>
    s.destination.recommended_months.includes(
      travelMonth as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
    ),
  ).length;
  return (inSeason / stops.length) * 100;
}

/** 25 % — penalise heavy daily driving (250 km = danger threshold) */
function dailyDrivingSafety(plan: ItineraryPlan): number {
  if (plan.days.length === 0) return 100;
  const avgDailyKm =
    plan.days.reduce((sum, d) => sum + d.totalKm, 0) / plan.days.length;
  return Math.max(0, (1 - avgDailyKm / 250)) * 100;
}

/** 25 % — hard-coded; the engine already enforces rest gaps */
const REST_COMPLIANCE = 85;

// ---------------------------------------------------------------------------
// Enjoyment sub-scores (each 0-100)
// ---------------------------------------------------------------------------

/**
 * 35 % — average of the "interest" scoreComponent across all stops.
 * If a stop has no "interest" component we treat its value as 0.
 */
function interestMatch(stops: ScheduledStop[]): number {
  if (stops.length === 0) return 0;
  const total = stops.reduce((sum, s) => {
    const comp = s.scoreComponents.find((c) => c.name === 'interest');
    return sum + (comp ? comp.value : 0);
  }, 0);
  return (total / stops.length) * 100;
}

/** 25 % — how many of the 6 possible categories appear */
function categoryDiversity(stops: ScheduledStop[]): number {
  const cats = new Set<string>();
  for (const s of stops) {
    for (const c of s.destination.categories) {
      cats.add(c);
    }
  }
  return (cats.size / 6) * 100;
}

/** 20 % — stop count vs packed-max (5 per day) */
function fullness(totalStops: number, days: number): number {
  if (days === 0) return 0;
  return (totalStops / (days * 5)) * 100;
}

/** 20 % — region spread relative to trip length */
function regionDiversity(plan: ItineraryPlan): number {
  if (plan.days.length === 0) return 0;
  const regions = new Set(plan.days.map((d) => d.region));
  return (regions.size / Math.min(plan.days.length, 6)) * 100;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function scorePlan(plan: ItineraryPlan): TripScores {
  const stops = allStops(plan);
  const numDays = plan.days.length;
  const travelMonth = plan.inputs.travelMonth;

  // --- Safety (weighted avg, 0-100) ---
  const safety = clamp(
    0.25 * crowdAvoidance(stops) +
      0.25 * seasonFit(stops, travelMonth) +
      0.25 * dailyDrivingSafety(plan) +
      0.25 * REST_COMPLIANCE,
    0,
    100,
  );

  // --- Enjoyment (weighted avg, 0-100) ---
  const enjoyment = clamp(
    0.35 * interestMatch(stops) +
      0.25 * categoryDiversity(stops) +
      0.20 * fullness(stops.length, numDays) +
      0.20 * regionDiversity(plan),
    0,
    100,
  );

  // --- Cost efficiency ---
  const grandTotal = plan.costBreakdown.grandTotal;
  const costEfficiency = clamp(
    (enjoyment / 100) * (1 - grandTotal / 800) * 150,
    0,
    100,
  );

  // --- Overall ---
  const avg = (safety + enjoyment) / 2;
  const overall: TripScores['overall'] =
    avg >= 80 ? 'excellent' : avg >= 55 ? 'good' : 'fair';

  return { safety, enjoyment, costEfficiency, overall };
}
