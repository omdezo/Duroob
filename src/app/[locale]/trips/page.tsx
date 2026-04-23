'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Map, CalendarDays, Wallet, Shield, Smile,
  Loader2, Luggage, ExternalLink, Globe, Lock,
} from 'lucide-react';

interface SavedTrip {
  id: string;
  user_id: string | null;
  title: string;
  inputs_json: any;
  plan_json: any;
  scores_json: any;
  is_public?: boolean;
  share_count?: number;
  created_at: string;
}

export default function TripsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const ar = locale === 'ar';
  const { data: session, status } = useSession();

  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTrips() {
      try {
        const res = await fetch('/api/trips');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        // Filter to user's trips if authenticated
        const userId = (session?.user as any)?.id;
        const allTrips: SavedTrip[] = data.data ?? [];
        setTrips(userId ? allTrips.filter(t => t.user_id === userId) : allTrips);
      } catch {
        setError(ar ? 'حدث خطأ في تحميل الرحلات' : 'Failed to load trips');
      } finally {
        setLoading(false);
      }
    }
    if (status !== 'loading') {
      fetchTrips();
    }
  }, [session, status, ar]);

  async function toggleShare(tripId: string, current: boolean) {
    // Optimistic update
    setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, is_public: !current } : t)));
    try {
      const res = await fetch(`/api/trips/${tripId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !current }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, is_public: current } : t)));
    }
  }

  // Format date
  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString(ar ? 'ar-OM' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-[calc(100dvh-64px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <Map size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {ar ? 'رحلاتي' : 'My Trips'}
            </h1>
            <p className="text-sm text-gray-500">
              {ar ? 'الرحلات المحفوظة والمخطط لها' : 'Your saved and planned trips'}
            </p>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="flex gap-3">
                      <div className="h-8 bg-gray-100 rounded-lg w-20" />
                      <div className="h-8 bg-gray-100 rounded-lg w-20" />
                      <div className="h-8 bg-gray-100 rounded-lg w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && trips.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Luggage size={28} className="text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              {ar ? 'لا توجد رحلات بعد' : 'No trips yet'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              {ar
                ? 'ابدأ بتخطيط رحلتك الأولى عبر المخطط الذكي'
                : 'Start planning your first trip using the Smart Planner'}
            </p>
            <Link
              href={`/${locale}/chat`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition"
            >
              {ar ? 'ابدأ التخطيط' : 'Start Planning'}
            </Link>
          </div>
        )}

        {/* Trip cards */}
        {!loading && !error && trips.length > 0 && (
          <div className="space-y-4">
            {trips.map(trip => {
              const plan = trip.plan_json;
              const scores = trip.scores_json;
              const dayCount = plan?.days?.length ?? 0;
              const totalCost = plan?.costBreakdown?.grandTotal ?? 0;
              const overall = scores?.overall;

              return (
                <div
                  key={trip.id}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {trip.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {formatDate(trip.created_at)}
                        </p>
                      </div>
                      {overall && (
                        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                          overall === 'excellent' ? 'bg-green-100 text-green-700' :
                          overall === 'good' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {ar
                            ? (overall === 'excellent' ? 'ممتازة' : overall === 'good' ? 'جيدة' : 'مقبولة')
                            : overall
                          }
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-3 mt-4">
                      {dayCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                          <CalendarDays size={13} />
                          {dayCount} {ar ? 'أيام' : 'days'}
                        </span>
                      )}
                      {totalCost > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-medium">
                          <Wallet size={13} />
                          {totalCost} {ar ? 'ر.ع' : 'OMR'}
                        </span>
                      )}
                      {scores?.safety != null && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg text-xs font-medium">
                          <Shield size={13} />
                          {ar ? 'السلامة' : 'Safety'} {Number(scores.safety).toFixed(0)}
                        </span>
                      )}
                      {scores?.enjoyment != null && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg text-xs font-medium">
                          <Smile size={13} />
                          {ar ? 'المتعة' : 'Enjoy'} {Number(scores.enjoyment).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer: share toggle + view */}
                  <div className="flex border-t border-gray-100">
                    <button
                      onClick={() => toggleShare(trip.id, !!trip.is_public)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
                        trip.is_public
                          ? 'text-teal-600 hover:bg-teal-50'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                      title={ar ? 'مشاركة عامة' : 'Share publicly'}
                    >
                      {trip.is_public ? <Globe size={14} /> : <Lock size={14} />}
                      {trip.is_public
                        ? (ar ? 'عامة' : 'Public')
                        : (ar ? 'خاصة' : 'Private')}
                    </button>
                    <Link
                      href={trip.is_public ? `/${locale}/community/${trip.id}` : `/${locale}/planner`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-teal-600 hover:bg-teal-50 transition border-s border-gray-100"
                    >
                      <ExternalLink size={14} />
                      {ar ? 'عرض' : 'View'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
