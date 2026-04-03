import type { RegionAllocation } from '@/types/planner';

interface RegionAllocationViewProps {
  allocations: RegionAllocation[];
  locale: string;
}

const REGION_COLORS: Record<string, string> = {
  muscat: 'bg-teal-500',
  dakhiliya: 'bg-amber-500',
  sharqiya: 'bg-blue-500',
  dhofar: 'bg-green-500',
  batinah: 'bg-purple-500',
  dhahira: 'bg-rose-500',
};

const REGION_LABELS_AR: Record<string, string> = {
  muscat: 'مسقط',
  dakhiliya: 'الداخلية',
  sharqiya: 'الشرقية',
  dhofar: 'ظفار',
  batinah: 'الباطنة',
  dhahira: 'الظاهرة',
};

export default function RegionAllocationView({ allocations, locale }: RegionAllocationViewProps) {
  const isRtl = locale === 'ar';
  const totalDays = allocations.reduce((s, a) => s + a.daysCount, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-800 mb-5 text-base">
        {isRtl ? 'خطة المناطق' : 'Region Allocation Plan'}
      </h3>

      {/* Visual bar */}
      <div className="flex rounded-xl overflow-hidden h-6 mb-5">
        {allocations.map((a) => (
          <div
            key={a.region}
            className={`${REGION_COLORS[a.region] ?? 'bg-gray-400'} flex items-center justify-center`}
            style={{ width: `${(a.daysCount / totalDays) * 100}%` }}
            title={`${a.region}: ${a.daysCount} day${a.daysCount > 1 ? 's' : ''}`}
          />
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {allocations.map((a) => {
          const label = isRtl
            ? REGION_LABELS_AR[a.region] ?? a.region
            : a.region.charAt(0).toUpperCase() + a.region.slice(1);
          const dayRange = a.startDay === a.endDay
            ? `Day ${a.startDay}`
            : `Day ${a.startDay}–${a.endDay}`;

          return (
            <div key={a.region} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${REGION_COLORS[a.region] ?? 'bg-gray-400'}`} />
              <div className="flex-1 flex items-center justify-between">
                <span className="font-semibold text-gray-800 text-sm capitalize">{label}</span>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{dayRange}</span>
                  <span>{a.daysCount} {isRtl ? 'يوم' : a.daysCount === 1 ? 'day' : 'days'}</span>
                  <span className="text-xs text-teal-600 font-medium">
                    {(a.regionScore * 100).toFixed(0)}% match
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
