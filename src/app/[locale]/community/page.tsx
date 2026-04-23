'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Users, Sparkles, CalendarDays, Wallet, MapPin, TrendingUp, Loader2, Compass,
} from 'lucide-react';
import { REGION_NAMES, ALL_REGIONS } from '@/lib/constants';

interface CommunityTrip {
  id: string;
  title: string | null;
  inputs_json: any;
  plan_json: any;
  scores_json: any;
  share_count: number;
  created_at: string;
  author_name: string | null;
}

export default function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const ar = locale === 'ar';
  const [trips, setTrips] = useState<CommunityTrip[]>([]);
  const [forYou, setForYou] = useState<CommunityTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    const url = regionFilter
      ? `/api/community/trips?region=${regionFilter}`
      : '/api/community/trips';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setTrips(data.trips || []);
        setForYou(data.forYou || []);
      })
      .catch(() => {
        setTrips([]);
        setForYou([]);
      })
      .finally(() => setLoading(false));
  }, [regionFilter]);

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-[calc(100dvh-64px)] bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-teal-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {ar ? 'مجتمع الرحلات' : 'Community Trips'}
            </h1>
          </div>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl">
            {ar
              ? 'استكشف رحلات شاركها مستخدمون آخرون عبر دُروب، واستلهم خطتك القادمة.'
              : 'Browse real trips shared by other Duroob travelers, and find inspiration for your next plan.'}
          </p>
        </div>

        {/* Region filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setRegionFilter('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              regionFilter === ''
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
            }`}
          >
            {ar ? 'الكل' : 'All'}
          </button>
          {ALL_REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                regionFilter === r
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300'
              }`}
            >
              {REGION_NAMES[r][ar ? 'ar' : 'en']}
            </button>
          ))}
        </div>

        {/* For You section (auth-gated by server) */}
        {!loading && forYou.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {ar ? 'مقترحة لك' : 'For You'}
              </h2>
              <span className="text-xs text-gray-400 ms-1">
                {ar ? 'بناءً على اهتماماتك' : 'Based on your interests'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {forYou.map((t) => (
                <TripCard key={`fy-${t.id}`} trip={t} locale={locale} ar={ar} highlight />
              ))}
            </div>
          </section>
        )}

        {/* Main grid */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {ar ? 'الأكثر شعبية' : 'Popular Trips'}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-teal-600" />
            </div>
          ) : trips.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Compass size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium mb-1">
                {ar ? 'لا توجد رحلات عامة بعد' : 'No public trips yet'}
              </p>
              <p className="text-sm text-gray-400 mb-5">
                {ar ? 'كن أول من يشارك رحلته' : 'Be the first to share a trip'}
              </p>
              <Link
                href={`/${locale}/planner`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition"
              >
                {ar ? 'خطط رحلة' : 'Plan a Trip'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trips.map((t) => (
                <TripCard key={t.id} trip={t} locale={locale} ar={ar} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TripCard({
  trip, locale, ar, highlight = false,
}: { trip: CommunityTrip; locale: string; ar: boolean; highlight?: boolean }) {
  const plan = trip.plan_json;
  const dayCount = plan?.days?.length ?? 0;
  const totalCost = plan?.costBreakdown?.grandTotal ?? 0;
  const regions: string[] = Array.from(new Set((plan?.days || []).map((d: any) => d.region)));
  const overall = trip.scores_json?.overall;

  return (
    <Link
      href={`/${locale}/community/${trip.id}`}
      className={`block bg-white rounded-2xl border transition-all overflow-hidden group ${
        highlight
          ? 'border-amber-200 hover:border-amber-400 hover:shadow-lg'
          : 'border-gray-100 hover:border-teal-300 hover:shadow-md'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-teal-700 transition">
            {trip.title || (ar ? 'رحلة بدون عنوان' : 'Untitled Trip')}
          </h3>
          {overall && (
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              overall === 'excellent' ? 'bg-green-100 text-green-700' :
              overall === 'good' ? 'bg-yellow-100 text-yellow-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              {ar
                ? (overall === 'excellent' ? 'ممتازة' : overall === 'good' ? 'جيدة' : 'مقبولة')
                : overall}
            </span>
          )}
        </div>

        {trip.author_name && (
          <p className="text-xs text-gray-400 mb-3">
            {ar ? 'بواسطة' : 'by'} <span className="text-gray-600">{trip.author_name}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {regions.slice(0, 3).map((r) => (
            <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-[11px] font-medium">
              <MapPin size={10} />
              {REGION_NAMES[r]?.[ar ? 'ar' : 'en'] || r}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {dayCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={12} />
              {dayCount} {ar ? 'أيام' : 'days'}
            </span>
          )}
          {totalCost > 0 && (
            <span className="inline-flex items-center gap-1">
              <Wallet size={12} />
              {totalCost} {ar ? 'ر.ع' : 'OMR'}
            </span>
          )}
          {trip.share_count > 0 && (
            <span className="ms-auto inline-flex items-center gap-1 text-gray-400">
              <TrendingUp size={12} />
              {trip.share_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
