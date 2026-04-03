'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ItineraryPlan } from '@/types/itinerary';
import type { PlannerInputs } from '@/types/planner';
import type { TripScores } from '@/lib/planner/tripScorer';

interface PlannerState {
  inputs: PlannerInputs | null;
  plan: ItineraryPlan | null;
  scores: TripScores | null;
  isGenerating: boolean;
  error: string | null;
  source: 'manual' | 'chat' | null;
  chatSessionId: string | null;
  setInputs: (inputs: PlannerInputs) => void;
  setPlan: (plan: ItineraryPlan, scores: TripScores, source?: 'manual' | 'chat') => void;
  setGenerating: (v: boolean) => void;
  setError: (e: string | null) => void;
  clearPlan: () => void;
}

const DEFAULT_INPUTS: PlannerInputs = {
  durationDays: 3,
  budgetTier: 'medium',
  travelMonth: 1,
  intensity: 'balanced',
  preferredCategories: [],
};

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      inputs: DEFAULT_INPUTS,
      plan: null,
      scores: null,
      isGenerating: false,
      error: null,
      source: null,
      chatSessionId: null,
      setInputs: (inputs) => set({ inputs }),
      setPlan: (plan, scores, source = 'manual') =>
        set({ plan, scores, source, error: null }),
      setGenerating: (v) => set({ isGenerating: v }),
      setError: (e) => set({ error: e, isGenerating: false }),
      clearPlan: () => set({ plan: null, scores: null, error: null, source: null }),
    }),
    { name: 'duroob-planner', skipHydration: true }
  )
);
