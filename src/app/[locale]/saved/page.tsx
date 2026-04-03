'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useInterestStore } from '@/store/interestStore';
import { DESTINATIONS } from '@/data/destinations';
import DestinationCard from '@/components/marketing/DestinationCard';
import { Heart, Trash2, CalendarDays, LogIn } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function SavedPage({ params }: PageProps) {
  const { locale } = use(params);
  const isRtl = locale === 'ar';
  const t = useTranslations('nav');
  const { data: session } = useSession();

  const [hydrated, setHydrated] = useState(false);
  const savedIds = useInterestStore((s) => s.savedIds);
  const removeInterest = useInterestStore((s) => s.removeInterest);
  const clearAll = useInterestStore((s) => s.clearAll);

  useEffect(() => {
    useInterestStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const savedDestinations = DESTINATIONS.filter((d) => savedIds.includes(d.id));

  if (!hydrated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Sync banner for guests */}
      {!session && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-teal-50 border border-teal-100 rounded-xl">
          <LogIn size={18} className="text-teal-600 flex-shrink-0" />
          <p className="text-sm text-teal-700 flex-1">
            {isRtl
              ? 'سجل الدخول لمزامنة وجهاتك المحفوظة عبر أجهزتك'
              : 'Sign in to sync your saved destinations across devices'}
          </p>
          <Link
            href={`/${locale}/auth/signin`}
            className="text-sm font-medium text-teal-700 hover:text-teal-800 underline underline-offset-2 flex-shrink-0"
          >
            {isRtl ? 'تسجيل الدخول' : 'Sign in'}
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Heart size={28} className="text-rose-500" />
            {session?.user?.name
              ? isRtl
                ? `وجهات ${session.user.name} المحفوظة`
                : `${session.user.name}'s Saved Destinations`
              : t('saved')}
          </h1>
          <p className="text-gray-500 mt-2">
            {isRtl
              ? `${savedDestinations.length} وجهة محفوظة`
              : `${savedDestinations.length} saved destination${savedDestinations.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {savedDestinations.length > 0 && (
          <div className="flex gap-2">
            <Link
              href={`/${locale}/planner`}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              <CalendarDays size={16} />
              {isRtl ? 'خطط رحلة بهذه الوجهات' : 'Plan Trip with These'}
            </Link>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              {isRtl ? 'مسح الكل' : 'Clear All'}
            </button>
          </div>
        )}
      </div>

      {savedDestinations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
            <Heart size={40} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {isRtl ? 'لا توجد وجهات محفوظة' : 'No Saved Destinations'}
          </h2>
          <p className="text-gray-400 mb-6 max-w-sm">
            {isRtl
              ? 'استكشف الوجهات واضغط على زر القلب لحفظها هنا.'
              : 'Browse destinations and tap the heart button to save them here.'}
          </p>
          <Link
            href={`/${locale}/destinations`}
            className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
          >
            {isRtl ? 'استكشف الوجهات' : 'Explore Destinations'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedDestinations.map((dest) => (
            <div key={dest.id} className="relative group">
              <DestinationCard destination={dest} locale={locale} />
              {/* Remove button overlay */}
              <button
                onClick={() => removeInterest(dest.id)}
                className="absolute top-3 end-3 z-10 w-9 h-9 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                aria-label={isRtl ? 'إزالة' : 'Remove'}
              >
                <Heart size={16} fill="white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
