'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { PlannerInputs, BudgetTier } from '@/types/planner';
import type { ItineraryPlan } from '@/types/itinerary';
import { generateItinerary } from '@/lib/planner/itineraryEngine';
import { scorePlan, type TripScores } from '@/lib/planner/tripScorer';

interface ComparisonViewProps {
  baseInputs: PlannerInputs;
  locale: string;
  onPickPlan: (plan: ItineraryPlan, scores: TripScores, tier: BudgetTier) => void;
  onBack: () => void;
}

interface TierResult {
  tier: BudgetTier;
  plan: ItineraryPlan;
  scores: TripScores;
}

const TIER_CONFIG: Record<BudgetTier, { emoji: string; color: string; bg: string }> = {
  low: { emoji: '💰', color: 'text-green-700', bg: 'bg-green-50' },
  medium: { emoji: '✈️', color: 'text-blue-700', bg: 'bg-blue-50' },
  luxury: { emoji: '💎', color: 'text-purple-700', bg: 'bg-purple-50' },
};

export default function ComparisonView({ baseInputs, locale, onPickPlan, onBack }: ComparisonViewProps) {
  const t = useTranslations('planner');
  const tEval = useTranslations('evaluation');

  const results = useMemo<TierResult[]>(() => {
    const tiers: BudgetTier[] = ['low', 'medium', 'luxury'];
    return tiers.map((tier) => {
      const inputs = { ...baseInputs, budgetTier: tier, customBudgetOmr: undefined };
      const plan = generateItinerary(inputs);
      const scores = scorePlan(plan);
      return { tier, plan, scores };
    });
  }, [baseInputs]);

  // Find the "recommended" tier — best avg(safety, enjoyment) per OMR
  const recommended = results.reduce((best, r) => {
    const bestAvg = (best.scores.safety + best.scores.enjoyment) / 2 / Math.max(best.plan.costBreakdown.grandTotal, 1);
    const rAvg = (r.scores.safety + r.scores.enjoyment) / 2 / Math.max(r.plan.costBreakdown.grandTotal, 1);
    return rAvg > bestAvg ? r : best;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {locale === 'ar' ? 'مقارنة الخطط' : 'Compare Trip Plans'}
        </h2>
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-teal-600 transition-colors"
        >
          {locale === 'ar' ? '← العودة' : '← Back'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.map((result) => {
          const cfg = TIER_CONFIG[result.tier];
          const isRecommended = result.tier === recommended.tier;
          const totalStops = result.plan.days.reduce((s, d) => s + d.stops.length, 0);
          const uniqueRegions = new Set(result.plan.days.map((d) => d.region)).size;

          return (
            <div
              key={result.tier}
              className={`rounded-2xl border-2 overflow-hidden transition-all ${
                isRecommended ? 'border-teal-500 shadow-lg' : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className={`${cfg.bg} p-4 text-center relative`}>
                {isRecommended && (
                  <span className="absolute top-2 end-2 bg-teal-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {locale === 'ar' ? 'موصى به' : 'RECOMMENDED'}
                  </span>
                )}
                <span className="text-3xl">{cfg.emoji}</span>
                <p className={`font-bold text-lg mt-1 ${cfg.color}`}>
                  {t(result.tier)}
                </p>
              </div>

              {/* Stats */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="font-bold text-gray-900">{totalStops}</p>
                    <p className="text-gray-500 text-xs">{t('results.stops')}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{uniqueRegions}</p>
                    <p className="text-gray-500 text-xs">{locale === 'ar' ? 'مناطق' : 'regions'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{Math.round(result.plan.totalKm)}</p>
                    <p className="text-gray-500 text-xs">{t('results.km')}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  {/* Safety */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{tEval('safety')}</span>
                    <span className="font-semibold">{Math.round(result.scores.safety)}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${result.scores.safety}%` }}
                    />
                  </div>

                  {/* Enjoyment */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{tEval('enjoyment')}</span>
                    <span className="font-semibold">{Math.round(result.scores.enjoyment)}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${result.scores.enjoyment}%` }}
                    />
                  </div>
                </div>

                {/* Cost */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">{t('results.total')}</span>
                    <span className="font-bold text-lg text-gray-900">
                      {result.plan.costBreakdown.grandTotal} <span className="text-sm font-normal">OMR</span>
                    </span>
                  </div>
                </div>

                {/* Pick button */}
                <button
                  onClick={() => onPickPlan(result.plan, result.scores, result.tier)}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors ${
                    isRecommended
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {locale === 'ar' ? 'اختر هذه الخطة' : 'Pick This Plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
