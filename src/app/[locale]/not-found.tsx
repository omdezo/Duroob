import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-teal-600 mb-4">404</h1>
      <p className="text-xl text-gray-700 mb-2">{t('notFoundTitle')}</p>
      <p className="text-gray-500 mb-8">{t('notFoundDescription')}</p>
      <Link
        href="/"
        className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-teal-700 transition-colors"
      >
        {t('goHome')}
      </Link>
    </div>
  );
}
