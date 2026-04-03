'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MapPin, CalendarCheck, Users, ShieldCheck, TrendingUp } from 'lucide-react';
import { DESTINATIONS } from '@/data/destinations';

// Real data computed from actual destinations
const destCount = DESTINATIONS.length;
const regionCounts: Record<string, number> = {};
DESTINATIONS.forEach(d => { regionCounts[d.region.en] = (regionCounts[d.region.en] || 0) + 1; });
const avgCrowd = (DESTINATIONS.reduce((s, d) => s + d.crowd_level, 0) / destCount).toFixed(1);
const freeCount = DESTINATIONS.filter(d => d.ticket_cost_omr === 0).length;

const REGION_AR: Record<string,string> = { muscat:'مسقط', dakhiliya:'الداخلية', sharqiya:'الشرقية', dhofar:'ظفار', batinah:'الباطنة', dhahira:'الظاهرة' };
const POPULAR_REGIONS = Object.entries(regionCounts)
  .sort(([,a],[,b]) => b - a)
  .map(([region, count]) => ({
    nameEn: region.charAt(0).toUpperCase() + region.slice(1),
    nameAr: REGION_AR[region] || region,
    pct: Math.round((count / destCount) * 100),
    count,
  }));

// Top destinations by most categories (most diverse = most interesting)
const TOP_DESTINATIONS = [...DESTINATIONS]
  .sort((a, b) => b.categories.length - a.categories.length || a.crowd_level - b.crowd_level)
  .slice(0, 5)
  .map((d, i) => ({
    nameEn: d.name.en,
    nameAr: d.name.ar,
    views: d.categories.length,
    label: `${d.categories.length} categories`,
  }));

export default function OverviewPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const isRtl = locale === 'ar';

  const [animatedBars, setAnimatedBars] = useState(false);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimatedBars(true));
    fetch('/api/admin/users').then(r => r.json()).then(d => setUserCount(d.users?.length ?? 0)).catch(() => {});
    return () => cancelAnimationFrame(frame);
  }, []);

  const KPI_DATA = [
    { labelEn: 'Total Destinations', labelAr: 'إجمالي الوجهات', value: String(destCount), trend: `${Object.keys(regionCounts).length} regions`, icon: MapPin, color: 'text-teal-600', bg: 'bg-teal-50' },
    { labelEn: 'Free Attractions', labelAr: 'مجانية الدخول', value: String(freeCount), trend: `${((freeCount/destCount)*100).toFixed(0)}%`, icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { labelEn: 'Registered Users', labelAr: 'المستخدمين المسجلين', value: String(userCount), trend: 'live', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    { labelEn: 'Avg Crowd Level', labelAr: 'متوسط الازدحام', value: avgCrowd, trend: '/5', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className={`text-2xl font-bold text-gray-900 ${isRtl ? 'text-right' : ''}`}>
          {isRtl ? 'نظرة عامة' : 'Overview'}
        </h1>
        <p className={`text-sm text-gray-500 mt-1 ${isRtl ? 'text-right' : ''}`}>
          {isRtl ? 'ملخص لوحة تحكم منصة دروب' : 'Duroob platform dashboard summary'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_DATA.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.labelEn}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
            >
              <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`${kpi.bg} ${kpi.color} p-2.5 rounded-xl`}>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"
                  title={isRtl ? 'مقارنة بآخر 30 يوم' : 'vs last 30 days'}
                >
                  <TrendingUp size={12} aria-hidden="true" />
                  {kpi.trend}
                </span>
              </div>
              <div className={`mt-4 ${isRtl ? 'text-right' : ''}`}>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isRtl ? kpi.labelAr : kpi.labelEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Regions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className={`text-base font-semibold text-gray-900 mb-4 ${isRtl ? 'text-right' : ''}`}>
            {isRtl ? 'المناطق الأكثر شعبية' : 'Popular Regions'}
          </h2>
          <div className="space-y-3">
            {POPULAR_REGIONS.map((region) => (
              <div key={region.nameEn}>
                <div className={`flex items-center justify-between text-sm mb-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-700 font-medium">
                    {isRtl ? region.nameAr : region.nameEn}
                  </span>
                  <span className="text-gray-500">{region.pct}%</span>
                </div>
                <div
                  className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex"
                  style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                  role="progressbar"
                  aria-valuenow={region.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${isRtl ? region.nameAr : region.nameEn}: ${region.pct}%`}
                >
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: animatedBars ? `${region.pct}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Destinations */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className={`text-base font-semibold text-gray-900 mb-4 ${isRtl ? 'text-right' : ''}`}>
            {isRtl ? 'الوجهات الأكثر زيارة' : 'Top Destinations'}
          </h2>
          <div className="space-y-3">
            {TOP_DESTINATIONS.map((dest, idx) => (
              <div
                key={dest.nameEn}
                className={`flex items-center gap-3 py-2 ${isRtl ? 'flex-row-reverse text-right' : ''}`}
              >
                <span className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700 font-medium truncate">
                  {isRtl ? dest.nameAr : dest.nameEn}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {dest.views.toLocaleString()} {isRtl ? 'مشاهدة' : 'views'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
