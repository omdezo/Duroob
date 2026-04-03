import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import HeroSection from '@/components/marketing/HeroSection';
import CategoryExplorer from '@/components/marketing/CategoryExplorer';
import FeaturedDestinations from '@/components/marketing/FeaturedDestinations';
import PlanCTA from '@/components/marketing/PlanCTA';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' });
  const tApp = await getTranslations({ locale, namespace: 'app' });
  return {
    title: `${tApp('name')} — ${t('tagline')}`,
    description: t('subtitle'),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <HeroSection locale={locale} />
      <CategoryExplorer locale={locale} />
      <FeaturedDestinations locale={locale} />
      <PlanCTA locale={locale} />
    </>
  );
}
