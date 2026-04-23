'use client';

import type { DayPlan } from '@/types/itinerary';
import StopCard from './StopCard';
import { MapPin, Clock, Route } from 'lucide-react';
import WeatherBadge from '../shared/WeatherBadge';

interface DayScheduleProps {
  day: DayPlan;
  locale: string;
  activeStopIndex: number | null;
  onStopClick: (idx: number) => void;
}

const REGION_LABELS_AR: Record<string, string> = {
  muscat: 'مسقط',
  dakhiliya: 'الداخلية',
  sharqiya: 'الشرقية',
  dhofar: 'ظفار',
  batinah: 'الباطنة',
  dhahira: 'الظاهرة',
};

export default function DaySchedule({ day, locale, activeStopIndex, onStopClick }: DayScheduleProps) {
  const isRtl = locale === 'ar';
  const regionLabel = isRtl
    ? REGION_LABELS_AR[day.region] ?? day.region
    : day.region.charAt(0).toUpperCase() + day.region.slice(1);

  const visitHours = Math.floor(day.totalVisitMinutes / 60);
  const visitMins = day.totalVisitMinutes % 60;
  const visitStr = visitHours > 0 ? `${visitHours}h ${visitMins > 0 ? `${visitMins}m` : ''}` : `${visitMins}m`;

  return (
    <div className="space-y-3">
      {/* Day header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center">
            {day.dayNumber}
          </div>
          <div>
            <p className="font-bold text-gray-800">
              {isRtl ? `اليوم ${day.dayNumber}` : `Day ${day.dayNumber}`}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} />
                {regionLabel}
              </span>
              <WeatherBadge region={day.region} locale={locale} compact />
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-4 text-xs text-gray-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span className="flex items-center gap-1">
            <Route size={11} />
            {day.totalKm} km
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {visitStr}
          </span>
          <span className="bg-gray-100 rounded-full px-2 py-0.5">
            {day.stops.length} {isRtl ? 'محطات' : 'stops'}
          </span>
        </div>
      </div>

      {/* Stops */}
      {day.stops.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          {isRtl ? 'لا توجد محطات لهذا اليوم.' : 'No stops for this day.'}
        </p>
      ) : (
        <div className="space-y-2">
          {day.stops.map((stop, idx) => (
            <StopCard
              key={stop.destination.id}
              stop={stop}
              locale={locale}
              index={idx}
              isActive={activeStopIndex === idx}
              onClick={() => onStopClick(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
