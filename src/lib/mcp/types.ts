import type { ItineraryPlan } from '@/types/itinerary';
import type { TripScores } from '@/lib/planner/tripScorer';
import type { Destination } from '@/types/destination';

export interface McpContext {
  userId?: string;
  locale: 'en' | 'ar';
  currentPlan?: ItineraryPlan;
  currentScores?: TripScores;
  destinations: Destination[];
}

export interface McpToolCall {
  tool: string;
  input: Record<string, any>;
}

export interface McpToolResult {
  plan?: ItineraryPlan;
  scores?: TripScores;
  destinations?: Destination[];
  info?: { content: string };
  recommendation?: { summary: string; data: any };
  changes?: Array<{ day: number; removed: string; added: string }>;
  error?: string;
}
