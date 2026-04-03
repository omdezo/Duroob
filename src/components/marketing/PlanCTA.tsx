import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CalendarDays } from 'lucide-react';

interface PlanCTAProps {
  locale: string;
}

export default function PlanCTA({ locale }: PlanCTAProps) {
  const t = useTranslations('hero');
  const isRtl = locale === 'ar';

  return (
    <section className="py-20 bg-gradient-to-br from-teal-600 to-teal-800 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-20 -end-20 w-80 h-80 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -start-10 w-60 h-60 rounded-full bg-white/5" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <CalendarDays className="w-16 h-16 text-white/80 mx-auto mb-6" />
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          {isRtl ? 'جاهز لتخطيط رحلتك؟' : 'Ready to Plan Your Trip?'}
        </h2>
        <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
          {isRtl
            ? 'أخبرنا بتفضيلاتك وسيبني مخطط الرحلة الذكي لديك برنامجاً مخصصاً يوماً بيوم.'
            : 'Tell us your preferences and our intelligent planner will build a personalised day-by-day itinerary for you.'}
        </p>
        <Link
          href={`/${locale}/planner`}
          className="inline-flex items-center gap-3 bg-white text-teal-700 font-bold px-10 py-4 rounded-xl hover:bg-teal-50 transition-colors shadow-lg text-lg"
        >
          <CalendarDays size={22} />
          {t('cta')}
        </Link>
      </div>
    </section>
  );
}
