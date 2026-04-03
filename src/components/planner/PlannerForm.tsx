'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useInterestStore } from '@/store/interestStore';
import { usePlannerStore } from '@/store/plannerStore';
import { generateItinerary } from '@/lib/planner/itineraryEngine';
import { scorePlan } from '@/lib/planner/tripScorer';
import type { PlannerInputs } from '@/types/planner';
import type { Category } from '@/types/destination';
import { DESTINATIONS } from '@/data/destinations';
import { CalendarDays, Loader2 } from 'lucide-react';

const CATEGORIES: Category[] = ['mountain', 'beach', 'culture', 'desert', 'nature', 'food'];
const CATEGORY_EMOJIS: Record<Category, string> = {
  mountain: '⛰️', beach: '🏖️', culture: '🕌', desert: '🏜️', nature: '🌿', food: '🍽️',
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

interface PlannerFormProps {
  locale: string;
}

export default function PlannerForm({ locale }: PlannerFormProps) {
  const t = useTranslations('planner');
  const tCat = useTranslations('categories');
  const isRtl = locale === 'ar';

  const { inputs, setInputs, setPlan, setGenerating, setError, isGenerating } = usePlannerStore();
  const savedIds = useInterestStore((s) => s.savedIds);

  const [hydrated, setHydrated] = useState(false);
  const [localInputs, setLocalInputs] = useState<PlannerInputs>(
    inputs ?? {
      durationDays: 3,
      budgetTier: 'medium',
      travelMonth: 1,
      intensity: 'balanced',
      preferredCategories: [],
    }
  );

  useEffect(() => {
    useInterestStore.persist.rehydrate();
    usePlannerStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  // Pre-populate categories from saved interests when first hydrated
  useEffect(() => {
    if (!hydrated) return;
    if (savedIds.length > 0 && localInputs.preferredCategories.length === 0) {
      const savedDests = DESTINATIONS.filter((d) => savedIds.includes(d.id));
      const cats = [...new Set(savedDests.flatMap((d) => d.categories))].slice(0, 4) as Category[];
      if (cats.length > 0) {
        setLocalInputs((prev) => ({ ...prev, preferredCategories: cats }));
      }
    }
  }, [hydrated, savedIds]);

  function toggleCategory(cat: Category) {
    setLocalInputs((prev) => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(cat)
        ? prev.preferredCategories.filter((c) => c !== cat)
        : [...prev.preferredCategories, cat],
    }));
  }

  function handleGenerate() {
    setInputs(localInputs);
    setGenerating(true);
    try {
      const plan = generateItinerary(localInputs);
      const scores = scorePlan(plan);
      setPlan(plan, scores, 'manual');
    } catch (e) {
      setError(String(e));
    } finally {
      setGenerating(false);
    }
  }

  const monthNames = isRtl ? MONTH_NAMES_AR : MONTH_NAMES_EN;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-800">{t('title')}</h2>
      <p className="text-sm text-gray-500">{t('subtitle')}</p>

      {/* Duration */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">{t('duration')}</label>
        <div className="flex gap-2 flex-wrap">
          {([1,2,3,4,5,6,7] as const).map((d) => (
            <button
              key={d}
              onClick={() => setLocalInputs((p) => ({ ...p, durationDays: d }))}
              className={`w-12 h-12 rounded-xl font-bold text-sm transition-all ${
                localInputs.durationDays === d
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-700'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">{localInputs.durationDays} {t('days')}</p>
      </div>

      {/* Budget */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">{t('budget')}</label>
        <div className="grid grid-cols-3 gap-3">
          {(['low','medium','luxury'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setLocalInputs((p) => ({ ...p, budgetTier: tier }))}
              className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                localInputs.budgetTier === tier
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-700'
              }`}
            >
              {tier === 'low' ? '💰' : tier === 'medium' ? '✈️' : '💎'} {t(tier as 'low')}
            </button>
          ))}
        </div>
      </div>

      {/* Month */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">{t('month')}</label>
        <select
          value={localInputs.travelMonth}
          onChange={(e) => setLocalInputs((p) => ({ ...p, travelMonth: Number(e.target.value) as 1 }))}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>{monthNames[m - 1]}</option>
          ))}
        </select>
      </div>

      {/* Intensity */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">{t('intensity')}</label>
        <div className="grid grid-cols-3 gap-3">
          {(['relaxed','balanced','packed'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setLocalInputs((p) => ({ ...p, intensity: level }))}
              className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                localInputs.intensity === level
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-700'
              }`}
            >
              {level === 'relaxed' ? '🌅' : level === 'balanced' ? '⚖️' : '🚀'} {t(level as 'relaxed')}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {localInputs.intensity === 'relaxed' ? '3' : localInputs.intensity === 'balanced' ? '4' : '5'} {t('results.stops')}/{t('days').replace(/s$/, '')}
        </p>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">{t('categories')}</label>
        {hydrated && savedIds.length > 0 && (
          <p className="text-xs text-teal-600 mb-3">✓ {t('fromSaved')}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const selected = localInputs.preferredCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selected
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-700'
                }`}
              >
                <span>{CATEGORY_EMOJIS[cat]}</span>
                <span>{tCat(cat as 'mountain')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold py-4 rounded-xl transition-colors text-base shadow-md"
      >
        {isGenerating ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            {t('generating')}
          </>
        ) : (
          <>
            <CalendarDays size={20} />
            {t('generate')}
          </>
        )}
      </button>
    </div>
  );
}
