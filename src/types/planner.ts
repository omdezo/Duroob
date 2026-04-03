import type { Category, Region } from './destination';

export type BudgetTier = 'low' | 'medium' | 'luxury';
export type TravelIntensity = 'relaxed' | 'balanced' | 'packed';

export interface BudgetAllocation {
  transport: number;      // percentage 0-100
  accommodation: number;
  activities: number;
  safety: number;
  food: number;
}

export interface PlannerInputs {
  durationDays: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  budgetTier: BudgetTier;
  customBudgetOmr?: number;
  travelMonth: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  intensity: TravelIntensity;
  preferredCategories: Category[];
  preferredRegions?: Region[];
  budgetAllocation?: BudgetAllocation;
}

export interface RegionAllocation {
  region: Region;
  startDay: number;
  endDay: number;
  daysCount: number;
  regionScore: number;
}

export interface ScoreComponent {
  name: string;
  label: string;
  value: number; // normalized 0–1
  contribution: number; // weighted contribution (can be negative)
}

export interface ScoredCandidate {
  destinationId: string;
  totalScore: number;
  components: ScoreComponent[];
}
