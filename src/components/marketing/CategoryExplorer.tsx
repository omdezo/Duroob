import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Category } from '@/types/destination';

interface CategoryExplorerProps {
  locale: string;
}

const CATEGORY_CONFIG: Record<Category, { emoji: string; bg: string; text: string }> = {
  mountain: { emoji: '⛰️', bg: 'from-slate-600 to-slate-800', text: 'text-white' },
  beach: { emoji: '🏖️', bg: 'from-cyan-500 to-blue-600', text: 'text-white' },
  culture: { emoji: '🕌', bg: 'from-amber-500 to-orange-600', text: 'text-white' },
  desert: { emoji: '🏜️', bg: 'from-yellow-600 to-orange-700', text: 'text-white' },
  nature: { emoji: '🌿', bg: 'from-green-500 to-teal-600', text: 'text-white' },
  food: { emoji: '🍽️', bg: 'from-rose-500 to-pink-600', text: 'text-white' },
};

const CATEGORIES: Category[] = ['mountain', 'beach', 'culture', 'desert', 'nature', 'food'];

export default function CategoryExplorer({ locale }: CategoryExplorerProps) {
  const t = useTranslations('categories');

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t('title')}</h2>
          <div className="w-16 h-1 bg-teal-600 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <Link
                key={cat}
                href={`/${locale}/destinations?category=${cat}`}
                className={`group relative bg-gradient-to-br ${config.bg} rounded-2xl p-6 flex flex-col items-center gap-3 card-hover text-center`}
              >
                <span className="text-4xl">{config.emoji}</span>
                <span className={`font-semibold ${config.text} text-sm`}>{t(cat)}</span>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-white/0 group-hover:ring-white/30 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
