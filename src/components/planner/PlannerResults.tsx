'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { ItineraryPlan } from '@/types/itinerary';
import RegionAllocationView from './RegionAllocationView';
import CostBreakdownPanel from './CostBreakdownPanel';
import DaySchedule from './DaySchedule';
import WeatherBadge from '../shared/WeatherBadge';
import { REGION_NAMES } from '@/lib/constants';
import { Map, ChevronLeft, ChevronRight, CloudSun } from 'lucide-react';

const ItineraryMap = dynamic(() => import('./ItineraryMap'), { ssr: false });

interface PlannerResultsProps {
  plan: ItineraryPlan;
  locale: string;
}

export default function PlannerResults({ plan, locale }: PlannerResultsProps) {
  const isRtl = locale === 'ar';
  const [activeDay, setActiveDay] = useState(1);
  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(true);

  const totalDays = plan.days.length;
  const activeDayPlan = plan.days.find((d) => d.dayNumber === activeDay);

  function goToDay(day: number) {
    if (day >= 1 && day <= totalDays) {
      setActiveDay(day);
      setActiveStopIndex(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {isRtl ? 'برنامج رحلتك' : 'Your Itinerary'}
        </h2>
        <div className="text-xs text-gray-400">
          {isRtl ? 'تم الإنشاء في' : 'Generated'}: {new Date(plan.generatedAt).toLocaleTimeString()}
        </div>
      </div>

      {/* Region allocation */}
      <RegionAllocationView allocations={plan.regionAllocation} locale={locale} />

      {/* Weather snapshot per region */}
      {(() => {
        const regions = Array.from(new Set(plan.days.map((d) => d.region)));
        if (regions.length === 0) return null;
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CloudSun size={16} className="text-sky-500" />
              <h3 className="font-semibold text-gray-800 text-sm">
                {isRtl ? 'الطقس الحالي في مناطقك' : 'Current Weather in Your Regions'}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {regions.map((r) => (
                <div key={r} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/40">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {REGION_NAMES[r]?.[isRtl ? 'ar' : 'en'] || r}
                    </p>
                  </div>
                  <WeatherBadge region={r} locale={locale} />
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Day navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-800 text-base">
            {isRtl ? 'برنامج يومي' : 'Day-by-Day Schedule'}
          </h3>

          {/* Map toggle */}
          <button
            onClick={() => setShowMap((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showMap ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Map size={13} />
            {isRtl ? 'الخريطة' : 'Map'}
          </button>
        </div>

        {/* Day tab buttons */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => goToDay(activeDay - 1)}
            disabled={activeDay === 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} className={isRtl ? 'rotate-180' : ''} />
          </button>
          {plan.days.map((day) => (
            <button
              key={day.dayNumber}
              onClick={() => goToDay(day.dayNumber)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeDay === day.dayNumber
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-700'
              }`}
            >
              {isRtl ? `يوم ${day.dayNumber}` : `Day ${day.dayNumber}`}
            </button>
          ))}
          <button
            onClick={() => goToDay(activeDay + 1)}
            disabled={activeDay === totalDays}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} className={isRtl ? 'rotate-180' : ''} />
          </button>
        </div>

        {/* Map */}
        {showMap && (
          <div className="mb-6">
            <ItineraryMap
              days={plan.days}
              activeDay={activeDay}
              activeStopIndex={activeStopIndex}
              locale={locale}
            />
          </div>
        )}

        {/* Day schedule */}
        {activeDayPlan && (
          <DaySchedule
            day={activeDayPlan}
            locale={locale}
            activeStopIndex={activeStopIndex}
            onStopClick={(idx) => setActiveStopIndex(activeStopIndex === idx ? null : idx)}
          />
        )}
      </div>

      {/* Cost breakdown */}
      <CostBreakdownPanel cost={plan.costBreakdown} locale={locale} />

      {/* Summary */}
      <div className="bg-teal-50 rounded-2xl p-6 border border-teal-100">
        <h3 className="font-bold text-teal-800 mb-3">
          {isRtl ? 'ملخص الرحلة' : 'Trip Summary'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: isRtl ? 'الأيام' : 'Days', value: plan.inputs.durationDays },
            { label: isRtl ? 'المناطق' : 'Regions', value: plan.regionAllocation.length },
            { label: isRtl ? 'المحطات' : 'Total Stops', value: plan.days.reduce((s, d) => s + d.stops.length, 0) },
            { label: isRtl ? 'المسافة' : 'Distance', value: `${plan.totalKm} km` },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-2xl font-bold text-teal-700">{item.value}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
