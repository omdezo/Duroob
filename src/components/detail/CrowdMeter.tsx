import { useTranslations } from 'next-intl';

interface CrowdMeterProps {
  level: number; // 1–5
  locale: string;
}

const COLORS = ['', 'bg-green-500', 'bg-lime-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];

export default function CrowdMeter({ level }: CrowdMeterProps) {
  const t = useTranslations('crowdLevels');
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            className={`flex-1 h-3 rounded-full transition-all ${
              i <= level ? COLORS[level] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-gray-500">{t(String(level))}</p>
    </div>
  );
}
