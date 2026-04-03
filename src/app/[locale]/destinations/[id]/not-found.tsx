import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function DestinationNotFound() {
  const t = useTranslations('errors');

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-3xl">?</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('destinationNotFound')}</h1>
      <p className="text-gray-500 mb-6">{t('destinationNotFoundDescription')}</p>
      <Link
        href="/destinations"
        className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
      >
        {t('browseAll')}
      </Link>
    </div>
  );
}
