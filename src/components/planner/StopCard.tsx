'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ScheduledStop } from '@/types/itinerary';
import type { Category } from '@/types/destination';
import { Clock, Ticket, ChevronDown, ChevronUp, Navigation } from 'lucide-react';

interface StopCardProps {
  stop: ScheduledStop;
  locale: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  mountain: '⛰️', beach: '🏖️', culture: '🕌', desert: '🏜️', nature: '🌿', food: '🍽️',
};

export default function StopCard({ stop, locale, index, isActive, onClick }: StopCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const t = useTranslations('planner.results');
  const tCommon = useTranslations('common');
  const tCard = useTranslations('card');
  const tCat = useTranslations('categories');
  const isRtl = locale === 'ar';
  const d = stop.destination;
  const name = d.name[locale as 'en' | 'ar'] ?? d.name.en;

  return (
    <div
      className={`rounded-xl border transition-all ${
        isActive
          ? 'border-teal-400 bg-teal-50/50 shadow-md'
          : 'border-gray-100 bg-white hover:border-teal-200'
      }`}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          {/* Stop number */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            isActive ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            {/* Travel info */}
            {stop.travelDistanceFromPrev > 0 && (
              <div className={`flex items-center gap-1 text-xs text-gray-400 mb-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Navigation size={11} />
                <span>{stop.travelDistanceFromPrev} {t('km')} · {stop.travelTimeFromPrev} {t('min')} {t('travel')}</span>
              </div>
            )}

            {/* Name */}
            <Link
              href={`/${locale}/destinations/${d.id}`}
              className="font-semibold text-gray-900 text-sm leading-snug hover:text-teal-700 transition-colors line-clamp-2"
              onClick={(e) => e.stopPropagation()}
            >
              {name}
            </Link>

            {/* Categories */}
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {d.categories.map((cat) => (
                <span key={cat} className="text-xs text-gray-500">
                  {CATEGORY_EMOJIS[cat]} {tCat(cat as Category)}
                </span>
              ))}
            </div>

            {/* Time row */}
            <div className={`flex items-center gap-4 mt-2 text-xs text-gray-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {stop.arrivalTime} – {stop.departureTime}
              </span>
              <span className="flex items-center gap-1">
                <Ticket size={11} />
                {d.ticket_cost_omr === 0 ? tCard('free') : `${d.ticket_cost_omr} ${tCommon('omr')}`}
              </span>
            </div>
          </div>
        </div>

        {/* Explanation toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowExplanation((v) => !v); }}
          className="mt-3 flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 transition-colors"
        >
          {showExplanation ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {isRtl ? 'لماذا هذه المحطة؟' : 'Why this stop?'}
        </button>

        {/* Explanation panel */}
        {showExplanation && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {isRtl ? 'أبرز العوامل المؤثرة' : 'Top contributing factors'}
            </p>
            {stop.topTwoComponents.map((comp) => (
              <div key={comp.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{comp.label}</span>
                  <span className="font-semibold text-gray-700">{(comp.value * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full score-bar"
                    style={{ '--fill-width': `${comp.value * 100}%`, width: `${comp.value * 100}%` } as React.CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
