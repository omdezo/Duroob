'use client';

import { useTranslations } from 'next-intl';

interface TripEvaluationProps {
  scores: {
    safety: number;
    enjoyment: number;
    costEfficiency: number;
    overall: 'excellent' | 'good' | 'fair';
  };
  locale: string;
}

const OVERALL_STYLES: Record<string, string> = {
  excellent: 'bg-green-100 text-green-700',
  good: 'bg-yellow-100 text-yellow-700',
  fair: 'bg-orange-100 text-orange-700',
};

export default function TripEvaluation({ scores }: TripEvaluationProps) {
  const t = useTranslations('evaluation');

  const bars = [
    { key: 'safety', score: scores.safety, color: 'bg-teal-500' },
    { key: 'enjoyment', score: scores.enjoyment, color: 'bg-amber-400' },
    { key: 'costEfficiency', score: scores.costEfficiency, color: 'bg-green-500' },
  ] as const;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-800 mb-5 text-base">{t('title')}</h3>

      <div className="space-y-4">
        {bars.map(({ key, score, color }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">{t(key)}</span>
              <span className="text-sm font-semibold text-gray-800">{score}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full ${color} score-bar`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mt-5 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{t('overall')}</span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${OVERALL_STYLES[scores.overall]}`}
          >
            {t(scores.overall)}
          </span>
        </div>
      </div>
    </div>
  );
}
