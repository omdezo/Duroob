'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Category, Region } from '@/types/destination';
import type { FilterState } from '@/lib/utils/destinationFilters';
import { filtersToSearchParams } from '@/lib/utils/destinationFilters';
import { X } from 'lucide-react';

const CATEGORIES: Category[] = ['mountain', 'beach', 'culture', 'desert', 'nature', 'food'];
const REGIONS: Region[] = ['muscat', 'dakhiliya', 'sharqiya', 'dhofar', 'batinah', 'dhahira'];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const MONTH_NAMES: Record<number, { en: string; ar: string }> = {
  1: { en: 'January', ar: 'يناير' },
  2: { en: 'February', ar: 'فبراير' },
  3: { en: 'March', ar: 'مارس' },
  4: { en: 'April', ar: 'أبريل' },
  5: { en: 'May', ar: 'مايو' },
  6: { en: 'June', ar: 'يونيو' },
  7: { en: 'July', ar: 'يوليو' },
  8: { en: 'August', ar: 'أغسطس' },
  9: { en: 'September', ar: 'سبتمبر' },
  10: { en: 'October', ar: 'أكتوبر' },
  11: { en: 'November', ar: 'نوفمبر' },
  12: { en: 'December', ar: 'ديسمبر' },
};

interface FilterBarProps {
  filters: FilterState;
  locale: string;
  resultCount: number;
}

export default function FilterBar({ filters, locale, resultCount }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('destinations');

  function updateFilters(updates: Partial<FilterState>) {
    const newFilters = { ...filters, ...updates };
    const params = filtersToSearchParams(newFilters);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(pathname);
  }

  const hasActiveFilters = !!(filters.category || filters.region || filters.season || filters.sortBy);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 text-sm">{t('filterBy')}</h3>
        <span className="text-xs text-gray-400">{resultCount} results</span>
      </div>

      {/* Category filter */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">{t('category')}</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateFilters({ category: '' })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !filters.category ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('allCategories')}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilters({ category: cat })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                filters.category === cat ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Region filter */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">{t('region')}</label>
        <select
          value={filters.region}
          onChange={(e) => updateFilters({ region: e.target.value as Region | '' })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="">{t('allRegions')}</option>
          {REGIONS.map((r) => (
            <option key={r} value={r} className="capitalize">
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Season filter */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">{t('season')}</label>
        <select
          value={filters.season}
          onChange={(e) => updateFilters({ season: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          <option value="">{t('allSeasons')}</option>
          {MONTHS.map((m) => (
            <option key={m} value={String(m)}>
              {MONTH_NAMES[m][locale as 'en' | 'ar']}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">{t('sortBy')}</label>
        <div className="flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value as 'crowd' | 'cost' | '' })}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">—</option>
            <option value="crowd">{t('crowd')}</option>
            <option value="cost">{t('cost')}</option>
          </select>
          {filters.sortBy && (
            <select
              value={filters.sortDir}
              onChange={(e) => updateFilters({ sortDir: e.target.value as 'asc' | 'desc' })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="asc">{t('ascending')}</option>
              <option value="desc">{t('descending')}</option>
            </select>
          )}
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:text-red-700 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
        >
          <X size={14} />
          {t('clearFilters')}
        </button>
      )}
    </div>
  );
}
