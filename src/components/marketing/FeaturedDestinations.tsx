import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getActiveDestinations } from '@/db';
import DestinationCard from './DestinationCard';

interface FeaturedDestinationsProps {
  locale: string;
}

export default async function FeaturedDestinations({ locale }: FeaturedDestinationsProps) {
  const t = await getTranslations({ locale, namespace: 'featured' });

  // Top 6 by crowd level desc, tie-break by id for determinism. DB-backed so
  // admin edits show up here without a redeploy.
  const all = await getActiveDestinations();
  const featured = [...all]
    .sort((a, b) => b.crowd_level - a.crowd_level || a.id.localeCompare(b.id))
    .slice(0, 6);

  return (
    <section className="py-20" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-gray-500 text-lg">{t('subtitle')}</p>
          <div className="w-16 h-1 bg-teal-600 mx-auto rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} locale={locale} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href={`/${locale}/destinations`}
            className="inline-flex items-center gap-2 bg-teal-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-teal-700 transition-colors"
          >
            {locale === 'ar' ? 'عرض جميع الوجهات' : 'View All Destinations'}
            <span className={locale === 'ar' ? 'rotate-180' : ''}>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
