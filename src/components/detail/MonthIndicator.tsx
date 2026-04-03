import { useTranslations } from 'next-intl';

interface MonthIndicatorProps {
  recommendedMonths: number[];
  locale: string;
}

export default function MonthIndicator({ recommendedMonths }: MonthIndicatorProps) {
  const t = useTranslations('monthsShort');
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
        const isRec = recommendedMonths.includes(m);
        const label = t(String(m));
        return (
          <div
            key={m}
            title={label}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
              isRec
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {label.slice(0, 1)}
          </div>
        );
      })}
    </div>
  );
}
