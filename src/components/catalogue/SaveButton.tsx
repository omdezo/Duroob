'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useInterestStore } from '@/store/interestStore';

interface SaveButtonProps {
  destinationId: string;
  locale: string;
}

export default function SaveButton({ destinationId, locale }: SaveButtonProps) {
  const [hydrated, setHydrated] = useState(false);
  const toggleInterest = useInterestStore((s) => s.toggleInterest);
  const isInterest = useInterestStore((s) => s.isInterest);

  useEffect(() => {
    // Rehydrate from LocalStorage after mount to prevent SSR mismatch
    useInterestStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const saved = hydrated ? isInterest(destinationId) : false;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleInterest(destinationId);
      }}
      aria-label={saved ? 'Remove from interests' : 'Save to interests'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        saved
          ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
          : 'bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-500'
      }`}
    >
      <Heart size={13} className={saved ? 'fill-rose-500 text-rose-500' : ''} />
      {saved
        ? (locale === 'ar' ? 'محفوظ' : 'Saved')
        : (locale === 'ar' ? 'حفظ' : 'Save')}
    </button>
  );
}
