'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CalendarDays, Wallet, Shield, Smile, MapPin, Clock, Loader2,
} from 'lucide-react';
import { REGION_NAMES } from '@/lib/constants';

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

export default function CommunityTripPage({
  params,
}: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = use(params);
  const ar = locale === 'ar';
  const [trip, setTrip] = useState<CommunityTrip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/community/trips/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.trip) setTrip(data.trip);
      })
      .finally(() => setLoading(false));
    // fire-and-forget view bump
    fetch(`/api/trips/${id}/share`).catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-[calc(100dvh-64px)] flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 mb-4">
          {ar ? 'الرحلة غير متاحة أو لم تعد عامة.' : 'Trip not available or no longer public.'}
        </p>
        <Link href={`/${locale}/community`} className="text-teal-600 font-medium hover:underline">
          {ar ? 'العودة إلى المجتمع' : 'Back to Community'}
        </Link>
      </div>
    );
  }

  const plan = trip.plan_json;
  const scores = trip.scores_json;
  const days = plan?.days || [];
  const totalCost = plan?.costBreakdown?.grandTotal ?? 0;

  return (
    <div dir={ar ? 'rtl' : 'ltr'} className="min-h-[calc(100dvh-64px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/${locale}/community`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 mb-6"
        >
          <ArrowLeft size={16} className={ar ? 'rotate-180' : ''} />
          {ar ? 'العودة إلى المجتمع' : 'Back to Community'}
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {trip.title || (ar ? 'رحلة' : 'Trip')}
          </h1>
          {trip.author_name && (
            <p className="text-sm text-gray-500 mb-4">
              {ar ? 'شاركها' : 'shared by'}{' '}
              <span className="text-gray-700 font-medium">{trip.author_name}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {days.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                <CalendarDays size={14} /> {days.length} {ar ? 'أيام' : 'days'}
              </span>
            )}
            {totalCost > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium">
                <Wallet size={14} /> {totalCost} {ar ? 'ر.ع' : 'OMR'}
              </span>
            )}
            {scores?.safety != null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg text-sm font-medium">
                <Shield size={14} /> {ar ? 'أمان' : 'Safety'} {Number(scores.safety).toFixed(0)}
              </span>
            )}
            {scores?.enjoyment != null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg text-sm font-medium">
                <Smile size={14} /> {ar ? 'متعة' : 'Enjoy'} {Number(scores.enjoyment).toFixed(0)}
              </span>
            )}
          </div>
        </div>

        {/* Days */}
        <div className="space-y-4">
          {days.map((d: any, idx: number) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">
                  {ar ? 'اليوم' : 'Day'} {d.dayNumber || idx + 1}
                </h3>
                <span className="inline-flex items-center gap-1 text-sm text-teal-700 font-medium">
                  <MapPin size={14} />
                  {ar ? (d.regionAr || REGION_NAMES[d.region]?.ar || d.region) : (REGION_NAMES[d.region]?.en || d.region)}
                </span>
              </div>
              <div className="p-5 space-y-3">
                {(d.stops || []).map((s: any, j: number) => (
                  <div key={j} className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center">
                      {j + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800">
                        {ar ? s.destination?.name?.ar : s.destination?.name?.en}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 inline-flex items-center gap-1">
                        <Clock size={11} /> {s.arrivalTime} → {s.departureTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <Link
            href={`/${locale}/planner`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition"
          >
            {ar ? 'خطط رحلة مشابهة' : 'Plan a Similar Trip'}
          </Link>
        </div>
      </div>
    </div>
  );
}
