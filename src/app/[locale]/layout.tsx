import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { SessionProvider } from 'next-auth/react';
import '../globals.css';
import Navbar from '@/components/shared/Navbar';
import { ToastProvider } from '@/components/shared/Toaster';
import CommandPalette from '@/components/shared/CommandPalette';
import GlobalFooter from '@/components/shared/GlobalFooter';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app' });
  return {
    title: `${t('name')} | ${t('tagline')}`,
    description: locale === 'ar'
      ? 'اكتشف جمال عُمان وخطط لرحلتك المثالية مع مخطط الرحلات الذكي.'
      : 'Discover the beauty of Oman and plan your perfect trip with our intelligent itinerary planner.',
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'app' });
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
          <ToastProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-[100] focus:bg-teal-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
            {locale === 'ar' ? 'تخطي إلى المحتوى' : 'Skip to content'}
          </a>
          <Navbar locale={locale} />
          <CommandPalette locale={locale} />
          <main id="main">{children}</main>
          <GlobalFooter locale={locale} />
          </ToastProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
