import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DESTINATIONS } from '@/data/destinations';
import { generateDescription } from '@/lib/utils/generateDescription';
import MonthIndicator from '@/components/detail/MonthIndicator';
import CrowdMeter from '@/components/detail/CrowdMeter';
import SaveButton from '@/components/catalogue/SaveButton';
import DetailMapClient from '@/components/detail/DetailMapClient';
import { MapPin, Clock, Ticket, Building2, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateStaticParams() {
  const locales = ['en', 'ar'];
  return DESTINATIONS.flatMap((d) => locales.map((locale) => ({ locale, id: d.id })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const dest = DESTINATIONS.find((d) => d.id === id);
  if (!dest) return {};
  const name = dest.name[locale as 'en' | 'ar'] ?? dest.name.en;
  return {
    title: `${name} — Duroob`,
    description: generateDescription(dest, locale as 'en' | 'ar'),
  };
}

const CATEGORY_EMOJIS: Record<string, string> = {
  mountain: '⛰️', beach: '🏖️', culture: '🕌', desert: '🏜️', nature: '🌿', food: '🍽️',
};
const CATEGORY_COLORS: Record<string, string> = {
  mountain: 'bg-slate-100 text-slate-700',
  beach: 'bg-cyan-100 text-cyan-700',
  culture: 'bg-amber-100 text-amber-700',
  desert: 'bg-yellow-100 text-yellow-700',
  nature: 'bg-green-100 text-green-700',
  food: 'bg-rose-100 text-rose-700',
};

export default async function DestinationDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const dest = DESTINATIONS.find((d) => d.id === id);
  if (!dest) notFound();

  const t = await getTranslations({ locale, namespace: 'detail' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const name = dest.name[locale as 'en' | 'ar'] ?? dest.name.en;
  const region = dest.region[locale as 'en' | 'ar'] ?? dest.region.en;
  const company = dest.company[locale as 'en' | 'ar'] ?? dest.company.en;
  const description = generateDescription(dest, locale as 'en' | 'ar');
  const isRtl = locale === 'ar';

  const durationH = Math.floor(dest.avg_visit_duration_minutes / 60);
  const durationM = dest.avg_visit_duration_minutes % 60;
  const durationStr = durationH > 0
    ? `${durationH}h ${durationM > 0 ? `${durationM}m` : ''}`
    : `${durationM}m`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <Link
        href={`/${locale}/destinations`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 mb-8 transition-colors"
      >
        <ArrowLeft size={16} className={isRtl ? 'rotate-180' : ''} />
        {tCommon('backToDestinations')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 text-sm text-teal-600 font-medium mb-2">
                  <MapPin size={14} />
                  <span>{region}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{name}</h1>
              </div>
              <SaveButton destinationId={dest.id} locale={locale} />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mt-4">
              {dest.categories.map((cat) => (
                <span
                  key={cat}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  <span>{CATEGORY_EMOJIS[cat]}</span>
                  <span className="capitalize">{cat}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {t('about')}
            </h2>
            <p className="text-gray-600 leading-relaxed">{description}</p>
          </div>

          {/* Best months */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t('bestMonths')}
            </h2>
            <MonthIndicator recommendedMonths={dest.recommended_months} locale={locale} />
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t('mapPreview')}
            </h2>
            <DetailMapClient lat={dest.lat} lng={dest.lng} name={name} />
            <p className="text-xs text-gray-400 mt-2 text-center">
              {dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}
            </p>
          </div>

          {/* Similar Destinations */}
          {(() => {
            const similar = DESTINATIONS.filter(
              (d) =>
                d.id !== dest.id &&
                d.region.en === dest.region.en &&
                d.categories.some((c) => dest.categories.includes(c))
            ).slice(0, 3);

            if (similar.length === 0) return null;
            return (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {isRtl ? 'وجهات مشابهة' : 'Similar Destinations'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {similar.map((s) => (
                    <Link
                      key={s.id}
                      href={`/${locale}/destinations/${s.id}`}
                      className="bg-white rounded-xl p-4 border border-gray-100 hover:border-teal-200 transition-colors group"
                    >
                      <p className="font-medium text-sm text-gray-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                        {s.name[locale as 'en' | 'ar'] ?? s.name.en}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {s.categories.slice(0, 2).join(' · ')} · {s.ticket_cost_omr === 0 ? (isRtl ? 'مجاني' : 'Free') : `${s.ticket_cost_omr} OMR`}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right column — info card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-20">
            <h3 className="font-semibold text-gray-800 mb-5">
              {t('visitInfo')}
            </h3>

            <div className="space-y-4">
              {/* Duration */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Clock size={18} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('duration')}</p>
                  <p className="font-semibold text-gray-800">{durationStr}</p>
                </div>
              </div>

              {/* Entry fee */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Ticket size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t('entry')}</p>
                  <p className="font-semibold text-gray-800">
                    {dest.ticket_cost_omr === 0
                      ? t('free')
                      : `${dest.ticket_cost_omr} ${tCommon('omr')}`}
                  </p>
                </div>
              </div>

              {/* Company */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Building2 size={18} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{tCommon('operator')}</p>
                  <p className="font-semibold text-gray-800 text-sm leading-snug">{company}</p>
                </div>
              </div>

              {/* Crowd level */}
              <div>
                <p className="text-xs text-gray-400 mb-2">{t('crowd')}</p>
                <CrowdMeter level={dest.crowd_level} locale={locale} />
              </div>
            </div>

            {/* CTA buttons */}
            <div className="mt-6 space-y-2">
              <Link
                href={`/${locale}/planner`}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 transition-colors text-sm"
              >
                {t('planTrip')}
              </Link>
              <Link
                href={`/${locale}/chat`}
                className="w-full flex items-center justify-center gap-2 bg-white text-teal-600 font-semibold py-3 rounded-xl hover:bg-teal-50 transition-colors text-sm border border-teal-200"
              >
                {isRtl ? 'خطط بالمحادثة الذكية' : 'Plan with Smart Chat'}
              </Link>
            </div>

            {/* Season hint */}
            {dest.recommended_months.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl">
                <p className="text-xs font-medium text-amber-800">
                  {isRtl ? '💡 أفضل وقت للزيارة:' : '💡 Best time to visit:'}
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  {dest.recommended_months.length === 12
                    ? (isRtl ? 'مناسب طوال السنة' : 'Great all year round')
                    : dest.recommended_months
                        .map((m) => {
                          const monthNames = isRtl
                            ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
                            : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                          return monthNames[m - 1];
                        })
                        .join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
