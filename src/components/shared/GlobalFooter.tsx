'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function GlobalFooter({ locale }: { locale: string }) {
  const t = useTranslations('app');
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === `/${locale}` || pathname === `/${locale}/`;

  if (isHome) return null;

  return (
    <footer className="bg-gray-900 text-gray-400 text-center py-8 text-sm mt-16 no-print">
      <p className="font-medium text-gray-300">{t('name')}</p>
      <p className="mt-1">{t('copyright')}</p>
      <p className="mt-1 text-xs text-gray-500">{t('dataSource')}</p>
    </footer>
  );
}
