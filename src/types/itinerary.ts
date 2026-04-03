import type { Destination } from './destination';
import type { RegionAllocation, ScoreComponent } from './planner';

export interface ScheduledStop {
  destination: Destination;
  arrivalTime: string;        // "HH:MM"
  departureTime: string;      // "HH:MM"
  travelDistanceFromPrev: number; // km
  travelTimeFromPrev: number;     // minutes
  scoreComponents: ScoreComponent[];
  topTwoComponents: ScoreComponent[];
}

export interface DayPlan {
  dayNumber: number;
  region: string;
  regionAr: string;
  stops: ScheduledStop[];
  totalKm: number;
  totalVisitMinutes: number;
  totalTravelMinutes: number;
}

export interface CostBreakdown {
  fuelOmr: number;
  ticketsOmr: number;
  foodOmr: number;
  hotelOmr: number;
  grandTotal: number;
  totalKm: number;
  budgetTier: string;
  withinBudget: boolean;
  budgetThreshold: number;
}

export interface ItineraryPlan {
  regionAllocation: RegionAllocation[];
  days: DayPlan[];
  costBreakdown: CostBreakdown;
  totalKm: number;
  inputs: {
    durationDays: number;
    budgetTier: string;
    travelMonth: number;
    intensity: string;
    preferredCategories: string[];
  };
  generatedAt: string; // ISO timestamp
}
