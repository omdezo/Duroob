import { useTranslations } from 'next-intl';
import type { Destination } from '@/types/destination';
import DestinationCard from '@/components/marketing/DestinationCard';
import SaveButton from './SaveButton';

interface DestinationGridProps {
  destinations: Destination[];
  locale: string;
}

export default function DestinationGrid({ destinations, locale }: DestinationGridProps) {
  const t = useTranslations('destinations');

  if (destinations.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-gray-500 text-lg">{t('noResults')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {destinations.map((dest) => (
        <div key={dest.id} className="relative">
          <DestinationCard destination={dest} locale={locale} />
          {/* Save button overlay */}
          <div className="absolute top-[155px] end-3 z-10">
            <SaveButton destinationId={dest.id} locale={locale} />
          </div>
        </div>
      ))}
    </div>
  );
}
