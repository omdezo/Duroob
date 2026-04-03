import { getTranslations } from 'next-intl/server';
import { DESTINATIONS } from '@/data/destinations';
import { filterDestinations, parseFiltersFromSearchParams } from '@/lib/utils/destinationFilters';
import FilterBar from '@/components/catalogue/FilterBar';
import DestinationGrid from '@/components/catalogue/DestinationGrid';
import DestinationSearch from '@/components/catalogue/DestinationSearch';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function DestinationsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'destinations' });
  const sp = await searchParams;
  const urlParams = new URLSearchParams(sp as Record<string, string>);
  const filters = parseFiltersFromSearchParams(urlParams);
  const searchQuery = sp.q?.toLowerCase() ?? '';

  let destinations = filterDestinations(DESTINATIONS, filters);

  // Apply text search
  if (searchQuery) {
    destinations = destinations.filter(
      (d) =>
        d.name.en.toLowerCase().includes(searchQuery) ||
        d.name.ar.includes(searchQuery) ||
        d.region.en.toLowerCase().includes(searchQuery) ||
        d.region.ar.includes(searchQuery)
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-500 mt-1">
              {destinations.length} {t('title').toLowerCase()}
            </p>
          </div>
          <DestinationSearch locale={locale} initialQuery={searchQuery} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <FilterBar filters={filters} locale={locale} resultCount={destinations.length} />
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          <DestinationGrid destinations={destinations} locale={locale} />
        </div>
      </div>
    </div>
  );
}
