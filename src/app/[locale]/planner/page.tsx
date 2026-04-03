'use client';

import { useEffect, useState } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import PlannerForm from '@/components/planner/PlannerForm';
import PlannerResults from '@/components/planner/PlannerResults';
import TripEvaluation from '@/components/planner/TripEvaluation';
import ComparisonView from '@/components/planner/ComparisonView';
import ShareActions from '@/components/planner/ShareActions';
import { Trash2, MessageCircle } from 'lucide-react';
import { use } from 'react';
import Link from 'next/link';
import type { BudgetTier } from '@/types/planner';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function PlannerPage({ params }: PageProps) {
  const { locale } = use(params);
  const [hydrated, setHydrated] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const plan = usePlannerStore((s) => s.plan);
  const scores = usePlannerStore((s) => s.scores);
  const inputs = usePlannerStore((s) => s.inputs);
  const clearPlan = usePlannerStore((s) => s.clearPlan);
  const setPlan = usePlannerStore((s) => s.setPlan);

  useEffect(() => {
    usePlannerStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const isRtl = locale === 'ar';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isRtl ? 'خطط رحلتك إلى عُمان' : 'Plan Your Oman Trip'}
        </h1>
        <p className="text-gray-500 mt-2">
          {isRtl
            ? 'مخطط رحلات ذكي يعمل بالكامل في متصفحك — بدون خوادم، بدون بيانات عشوائية.'
            : 'Intelligent trip planner running entirely in your browser — no servers, no randomness.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form column */}
        <div className="lg:col-span-4">
          <div className="sticky top-20">
            <PlannerForm locale={locale} />
            {hydrated && plan && (
              <>
                <Link
                  href={`/${locale}/chat`}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-sm text-teal-600 hover:text-teal-700 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors"
                >
                  <MessageCircle size={14} />
                  {isRtl ? 'ناقش في المحادثة الذكية' : 'Discuss in Smart Chat'}
                </Link>
                <button
                  onClick={clearPlan}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-400 hover:text-red-600 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  {isRtl ? 'مسح الخطة' : 'Clear Plan'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Results column */}
        <div className="lg:col-span-8">
          {!hydrated ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse text-gray-300 text-lg">
                {isRtl ? 'جارٍ التحميل…' : 'Loading…'}
              </div>
            </div>
          ) : showComparison && inputs ? (
            <ComparisonView
              baseInputs={inputs}
              locale={locale}
              onPickPlan={(pickedPlan, pickedScores, tier) => {
                setPlan(pickedPlan, pickedScores, 'manual');
                setShowComparison(false);
              }}
              onBack={() => setShowComparison(false)}
            />
          ) : plan ? (
            <div className="space-y-6">
              {/* Action bar */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <button
                  onClick={() => setShowComparison(true)}
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
                >
                  {isRtl ? 'مقارنة جميع المستويات' : 'Compare All Tiers'}
                </button>
                <ShareActions plan={plan} locale={locale} />
              </div>

              <PlannerResults plan={plan} locale={locale} />

              {/* Trip evaluation */}
              {scores && <TripEvaluation scores={scores} locale={locale} />}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-7xl mb-6">🗺️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {isRtl ? 'رحلتك تنتظر' : 'Your Adventure Awaits'}
              </h3>
              <p className="text-gray-400 max-w-sm">
                {isRtl
                  ? 'اضبط تفضيلاتك في النموذج واضغط على "إنشاء برنامج الرحلة".'
                  : 'Set your preferences in the form and click "Generate Itinerary".'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
