'use client';

import { useTranslations } from 'next-intl';

export default function PlannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-3xl">!</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('plannerError')}</h2>
        <p className="text-gray-500 mb-6 max-w-md">{t('plannerErrorDescription')}</p>
        <button
          onClick={reset}
          className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          {t('tryAgain')}
        </button>
      </div>
    </div>
  );
}
