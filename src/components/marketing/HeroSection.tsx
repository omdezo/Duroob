import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Map } from 'lucide-react';

interface HeroSectionProps {
  locale: string;
}

export default function HeroSection({ locale }: HeroSectionProps) {
  const t = useTranslations('hero');
  const isRtl = locale === 'ar';

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background image overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=1600&q=80')`,
        }}
      />
      <div className="hero-gradient absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl">
          {/* Oman flag accent */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-1 rounded-full bg-white/60" />
            <span className="text-white/80 text-sm font-medium uppercase tracking-widest">
              {isRtl ? 'مرحباً بك في' : 'Welcome to'}
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            {t('tagline')}
          </h1>

          <p className="text-xl text-white/85 mb-10 leading-relaxed max-w-2xl">
            {t('subtitle')}
          </p>

          <div className={`flex flex-wrap gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Link
              href={`/${locale}/planner`}
              className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-8 py-4 rounded-xl hover:bg-teal-50 transition-colors shadow-lg text-lg"
            >
              {t('cta')}
              <ArrowRight size={20} className={isRtl ? 'rotate-180' : ''} />
            </Link>
            <Link
              href={`/${locale}/destinations`}
              className="inline-flex items-center gap-2 border-2 border-white/80 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-lg"
            >
              <Map size={20} />
              {t('explore')}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-6 max-w-lg">
          {[
            { value: '6', label: isRtl ? 'مناطق' : 'Regions' },
            { value: '30+', label: isRtl ? 'وجهة' : 'Destinations' },
            { value: '7', label: isRtl ? 'أيام رحلة' : 'Day Trips' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-white/70 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-white/70 rounded-full" />
        </div>
      </div>
    </section>
  );
}
