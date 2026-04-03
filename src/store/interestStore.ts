'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InterestState {
  savedIds: string[];
  addInterest: (id: string) => void;
  removeInterest: (id: string) => void;
  toggleInterest: (id: string) => void;
  isInterest: (id: string) => boolean;
  clearAll: () => void;
}

export const useInterestStore = create<InterestState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      addInterest: (id) =>
        set((s) => ({ savedIds: s.savedIds.includes(id) ? s.savedIds : [...s.savedIds, id] })),
      removeInterest: (id) =>
        set((s) => ({ savedIds: s.savedIds.filter((x) => x !== id) })),
      toggleInterest: (id) => {
        const { savedIds } = get();
        set({ savedIds: savedIds.includes(id) ? savedIds.filter((x) => x !== id) : [...savedIds, id] });
      },
      isInterest: (id) => get().savedIds.includes(id),
      clearAll: () => set({ savedIds: [] }),
    }),
    { name: 'oman-interests', skipHydration: true }
  )
);
