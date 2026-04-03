import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Destination } from '@/types/destination';

interface DestinationCardProps {
  destination: Destination;
  locale: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  mountain: 'bg-slate-100 text-slate-700',
  beach: 'bg-cyan-100 text-cyan-700',
  culture: 'bg-amber-100 text-amber-700',
  desert: 'bg-yellow-100 text-yellow-700',
  nature: 'bg-green-100 text-green-700',
  food: 'bg-rose-100 text-rose-700',
};

const REGION_BG: Record<string, string> = {
  muscat: 'from-teal-500 to-cyan-600',
  dakhiliya: 'from-amber-500 to-orange-600',
  sharqiya: 'from-blue-500 to-indigo-600',
  dhofar: 'from-green-500 to-emerald-600',
  batinah: 'from-purple-500 to-violet-600',
  dhahira: 'from-rose-500 to-red-600',
};

function CrowdDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i <= level ? 'bg-orange-500' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function DestinationCard({ destination: d, locale }: DestinationCardProps) {
  const t = useTranslations('card');
  const tDest = useTranslations('destinations');
  const name = d.name[locale as 'en' | 'ar'] ?? d.name.en;
  const region = d.region[locale as 'en' | 'ar'] ?? d.region.en;
  const bg = REGION_BG[d.region.en] ?? 'from-gray-500 to-gray-700';

  const durationH = Math.floor(d.avg_visit_duration_minutes / 60);
  const durationM = d.avg_visit_duration_minutes % 60;
  const durationStr = durationH > 0
    ? `${durationH}h ${durationM > 0 ? `${durationM}m` : ''}`
    : `${durationM}m`;

  return (
    <Link href={`/${locale}/destinations/${d.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-hover h-full flex flex-col">
        {/* Header gradient */}
        <div className={`bg-gradient-to-br ${bg} p-6 flex items-center justify-center min-h-[140px] relative`}>
          <span className="text-5xl">
            {d.categories.includes('mountain') ? '⛰️' :
             d.categories.includes('beach') ? '🏖️' :
             d.categories.includes('desert') ? '🏜️' :
             d.categories.includes('culture') ? '🕌' :
             d.categories.includes('nature') ? '🌿' : '🍽️'}
          </span>
          {/* Region badge */}
          <div className="absolute top-3 start-3">
            <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
              {region}
            </span>
          </div>
          {/* Free badge */}
          {d.ticket_cost_omr === 0 && (
            <div className="absolute top-3 end-3">
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {tDest('entryFree')}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 group-hover:text-teal-700 transition-colors line-clamp-2">
            {name}
          </h3>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {d.categories.slice(0, 2).map((cat) => (
              <span key={cat} className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600'}`}>
                {cat}
              </span>
            ))}
          </div>

          <div className="mt-auto space-y-2">
            {/* Duration + Cost row */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>⏱ {durationStr}</span>
              <span className="font-semibold text-gray-700">
                {d.ticket_cost_omr === 0 ? t('free') : `${d.ticket_cost_omr} ${tDest('entryCost')}`}
              </span>
            </div>

            {/* Crowd */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{t('crowd')}</span>
              <CrowdDots level={d.crowd_level} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
