'use client';

import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { usePlannerStore } from '@/store/plannerStore';
import { useInterestStore } from '@/store/interestStore';
import { generateItinerary } from '@/lib/planner/itineraryEngine';
import { scorePlan } from '@/lib/planner/tripScorer';
import PlannerResults from '@/components/planner/PlannerResults';
import TripEvaluation from '@/components/planner/TripEvaluation';
import ComparisonView from '@/components/planner/ComparisonView';
import ShareActions from '@/components/planner/ShareActions';
import Link from 'next/link';
import type { PlannerInputs, BudgetTier } from '@/types/planner';
import type { Category, Region } from '@/types/destination';
import { useSession } from 'next-auth/react';
import {
  Sparkles, ArrowRight, ArrowLeft, Loader2, Trash2,
  MessageCircle, BarChart3, Shield, Smile, MapPin, Bookmark, Check, LogIn,
} from 'lucide-react';

const REGIONS: { id: Region; en: string; ar: string }[] = [
  { id: 'muscat', en: 'Muscat', ar: 'مسقط' },
  { id: 'dakhiliya', en: 'Dakhiliya', ar: 'الداخلية' },
  { id: 'sharqiya', en: 'Sharqiya', ar: 'الشرقية' },
  { id: 'dhofar', en: 'Dhofar', ar: 'ظفار' },
  { id: 'batinah', en: 'Batinah', ar: 'الباطنة' },
  { id: 'dhahira', en: 'Dhahira', ar: 'الظاهرة' },
];
const CATS: { id: Category; emoji: string }[] = [
  { id: 'culture', emoji: '🕌' }, { id: 'beach', emoji: '🏖️' }, { id: 'mountain', emoji: '⛰️' },
  { id: 'desert', emoji: '🏜️' }, { id: 'nature', emoji: '🌿' }, { id: 'food', emoji: '🍽️' },
];

export default function PlannerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const ar = locale === 'ar';
  const t = useTranslations('planner');
  const tCat = useTranslations('categories');
  const tM = useTranslations('planner.months');

  const { data: session } = useSession();
  const { plan, scores, inputs, setPlan, clearPlan } = usePlannerStore();
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<'wizard' | 'loading' | 'results'>('wizard');
  const [step, setStep] = useState(1);
  const [showCompare, setShowCompare] = useState(false);
  const [tripSaved, setTripSaved] = useState(false);

  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState<BudgetTier>('medium');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [intensity, setIntensity] = useState<'relaxed' | 'balanced' | 'packed'>('balanced');
  const [cats, setCats] = useState<Category[]>([]);
  const [regs, setRegs] = useState<Region[]>([]);

  useEffect(() => { usePlannerStore.persist.rehydrate(); useInterestStore.persist.rehydrate(); setHydrated(true); }, []);
  useEffect(() => { if (hydrated && plan) setView('results'); }, [hydrated, plan]);

  const toggleCat = (c: Category) => setCats(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  const toggleReg = (r: Region) => setRegs(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]);

  const generate = useCallback(async () => {
    setView('loading');
    try {
      const inp: PlannerInputs = { durationDays: days as any, budgetTier: budget, travelMonth: month as any, intensity, preferredCategories: cats, preferredRegions: regs.length > 0 ? regs : undefined };
      // Call API so trip is tracked in admin analytics
      const res = await fetch('/api/planner/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inp),
      });
      if (!res.ok) throw new Error('API failed');
      const { plan: p, scores: s } = await res.json();
      setPlan(p, s, 'manual'); setView('results');
    } catch {
      // Fallback: client-side generation
      const inp: PlannerInputs = { durationDays: days as any, budgetTier: budget, travelMonth: month as any, intensity, preferredCategories: cats, preferredRegions: regs.length > 0 ? regs : undefined };
      const p = generateItinerary(inp); const s = scorePlan(p);
      setPlan(p, s, 'manual'); setView('results');
    }
  }, [days, budget, month, intensity, cats, regs, setPlan]);

  const restart = () => { clearPlan(); setView('wizard'); setStep(1); setShowCompare(false); setTripSaved(false); };

  const [saveError, setSaveError] = useState('');

  const saveTrip = async () => {
    if (!plan || tripSaved) return;
    try {
      const res = await fetch('/api/trips', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `${plan.days.length}-day trip`, inputsJson: plan.inputs, planJson: plan, scoresJson: scores }),
      });
      if (!res.ok) throw new Error();
      setTripSaved(true);
      setSaveError('');
    } catch {
      setSaveError(ar ? 'فشل حفظ الرحلة. حاول مرة أخرى.' : 'Failed to save trip. Please try again.');
    }
  };

  if (!hydrated) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-teal-500" /></div>;

  // ═══ LOADING ═══
  if (view === 'loading') return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
      <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/25 animate-pulse">
        <Sparkles size={28} className="text-white" />
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mt-5">{ar ? 'جاري بناء رحلتك...' : 'Building your trip...'}</h2>
      <p className="text-sm text-gray-400 mt-1">{ar ? 'نحلل 30+ وجهة' : 'Analyzing 30+ destinations'}</p>
    </div>
  );

  // ═══ RESULTS ═══
  if (view === 'results' && plan) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <button onClick={restart} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center gap-1.5">
          <ArrowLeft size={14} className={ar ? 'rotate-180' : ''} /> {ar ? 'خطة جديدة' : 'New Plan'}
        </button>
        <button onClick={() => setShowCompare(!showCompare)} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center gap-1.5">
          <BarChart3 size={14} /> {ar ? 'قارن' : 'Compare'}
        </button>
        <Link href={`/${locale}/chat`} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center gap-1.5">
          <MessageCircle size={14} /> {ar ? 'المحادثة' : 'Chat'}
        </Link>
        <button onClick={saveTrip} disabled={tripSaved}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-1.5 ${
            tripSaved ? 'text-green-700 bg-green-50 border border-green-200'
            : 'text-white bg-teal-600 hover:bg-teal-700 shadow-sm'
          }`}>
          {tripSaved ? <Check size={14} /> : <Bookmark size={14} />}
          {tripSaved ? (ar ? 'تم الحفظ' : 'Saved!') : (ar ? 'حفظ الرحلة' : 'Save Trip')}
        </button>
        <div className="flex-1" />
        <ShareActions plan={plan} locale={locale} />
      </div>
      {/* Save error / sign-in prompt */}
      {saveError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm">
          <LogIn size={16} className="text-amber-600 shrink-0" />
          <span className="text-amber-700 flex-1">{saveError}</span>
          {!session && (
            <Link href={`/${locale}/auth/signin`} className="text-amber-700 font-medium underline shrink-0">
              {ar ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
          )}
        </div>
      )}

      {showCompare && inputs ? (
        <ComparisonView baseInputs={inputs} locale={locale} onPickPlan={(p, s) => { setPlan(p, s, 'manual'); setShowCompare(false); }} onBack={() => setShowCompare(false)} />
      ) : (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 rounded-2xl p-5 text-white">
            <h1 className="text-xl font-bold">{ar ? `رحلة ${plan.days.length} أيام` : `${plan.days.length}-Day Trip`}</h1>
            <p className="text-teal-100 text-sm mt-1">{plan.days.reduce((s, d) => s + d.stops.length, 0)} {ar ? 'محطة' : 'stops'} · {plan.costBreakdown.grandTotal} {ar ? 'ر.ع' : 'OMR'}</p>
            {scores && (
              <div className="flex gap-3 mt-3 text-sm">
                <span className="bg-white/15 px-2.5 py-1 rounded-lg"><Shield size={13} className="inline me-1" />{Math.round(scores.safety)}</span>
                <span className="bg-white/15 px-2.5 py-1 rounded-lg"><Smile size={13} className="inline me-1" />{Math.round(scores.enjoyment)}</span>
                <span className={`px-2.5 py-1 rounded-lg font-bold ${scores.overall === 'excellent' ? 'bg-green-400/25' : 'bg-yellow-400/25'}`}>
                  {ar ? (scores.overall === 'excellent' ? 'ممتازة' : scores.overall === 'good' ? 'جيدة' : 'مقبولة') : scores.overall}
                </span>
              </div>
            )}
          </div>
          <PlannerResults plan={plan} locale={locale} />
          {scores && <TripEvaluation scores={scores} locale={locale} />}
        </div>
      )}
    </div>
  );

  // ═══ WIZARD ═══
  const TOTAL_STEPS = 3;
  const canNext = step < TOTAL_STEPS;
  const canBack = step > 1;
  const isLast = step === TOTAL_STEPS;

  return (
    <div className="min-h-[calc(100dvh-64px)] flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-4 pt-10 sm:pt-16">
        <div className="w-full max-w-2xl">

          {/* Step dots */}
          <div className="flex items-center justify-center gap-3 mb-10">
            {[1, 2, 3].map(s => (
              <button key={s} onClick={() => setStep(s)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step ? 'w-10 bg-teal-500' : s < step ? 'w-6 bg-teal-300' : 'w-6 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* ── STEP 1: When ── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{ar ? 'متى وكم يوم؟' : 'When & how long?'}</h2>
                <p className="text-base text-gray-400 mt-2">{ar ? 'اختر مدة رحلتك وشهر السفر' : 'Pick your trip duration and travel month'}</p>
              </div>

              {/* Days */}
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider block mb-3">{ar ? 'عدد الأيام' : 'Number of days'}</label>
              <div className="grid grid-cols-7 gap-3 mb-2">
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                  <button key={d} onClick={() => setDays(d)}
                    className={`h-14 rounded-xl text-base font-bold transition-all duration-200 ${
                      days === d
                        ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30 scale-105'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-teal-400 hover:bg-teal-50'
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-400 mb-10">
                {days} {ar ? (days <= 2 ? 'يوم' : 'أيام') : (days === 1 ? 'day' : 'days')}
              </p>

              {/* Month */}
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider block mb-3">{ar ? 'شهر السفر' : 'Travel month'}</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <button key={m} onClick={() => setMonth(m)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      month === m ? 'bg-teal-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300 hover:bg-teal-50'
                    }`}>
                    {tM(String(m))}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Where & Style ── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{ar ? 'وين وكيف؟' : 'Where & how?'}</h2>
                <p className="text-base text-gray-400 mt-2">{ar ? 'اختر المنطقة والميزانية والوتيرة' : 'Pick region, budget, and pace'}</p>
              </div>

              {/* Regions */}
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider block mb-3">{ar ? 'المنطقة' : 'Region'} <span className="text-gray-300 normal-case font-normal">({ar ? 'اختياري' : 'optional'})</span></label>
              <div className="grid grid-cols-3 gap-2 mb-8">
                {REGIONS.map(r => (
                  <button key={r.id} onClick={() => toggleReg(r.id)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                      regs.includes(r.id) ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-teal-300'
                    }`}>
                    <MapPin size={16} className={`inline me-1.5 ${regs.includes(r.id) ? 'text-teal-500' : 'text-gray-400'}`} />
                    {ar ? r.ar : r.en}
                  </button>
                ))}
              </div>

              {/* Budget */}
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider block mb-3">{ar ? 'الميزانية' : 'Budget'}</label>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {([['low', '💰', '150'], ['medium', '✈️', '350'], ['luxury', '💎', '800']] as [BudgetTier, string, string][]).map(([b, e, p]) => (
                  <button key={b} onClick={() => setBudget(b)}
                    className={`py-5 rounded-xl text-center transition-all border-2 ${
                      budget === b ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-gray-100 bg-white hover:border-teal-200'
                    }`}>
                    <span className="text-2xl block">{e}</span>
                    <span className="text-sm font-bold text-gray-800 mt-1 block">{t(b as 'low')}</span>
                    <span className="text-xs text-gray-400 block">~{p} {ar ? 'ر.ع' : 'OMR'}</span>
                  </button>
                ))}
              </div>

              {/* Intensity */}
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider block mb-3">{ar ? 'الوتيرة' : 'Pace'}</label>
              <div className="grid grid-cols-3 gap-3">
                {([['relaxed', '🌅', 3], ['balanced', '⚖️', 4], ['packed', '🚀', 5]] as ['relaxed' | 'balanced' | 'packed', string, number][]).map(([i, e, n]) => (
                  <button key={i} onClick={() => setIntensity(i)}
                    className={`py-5 rounded-xl text-center transition-all border-2 ${
                      intensity === i ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-gray-100 bg-white hover:border-teal-200'
                    }`}>
                    <span className="text-2xl block">{e}</span>
                    <span className="text-sm font-bold text-gray-800 mt-1 block">{t(i)}</span>
                    <span className="text-xs text-gray-400 block">{n} {ar ? 'محطات/يوم' : 'stops/day'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Interests + Confirm ── */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{ar ? 'ايش يعجبك؟' : 'What do you enjoy?'}</h2>
                <p className="text-base text-gray-400 mt-2">{ar ? 'اختر اهتماماتك ثم أنشئ خطتك' : 'Pick your interests then create your plan'}</p>
              </div>

              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider block mb-3">{ar ? 'الاهتمامات' : 'Interests'} <span className="text-gray-300 normal-case font-normal">({ar ? 'اختياري' : 'optional'})</span></label>
              <div className="grid grid-cols-3 gap-3 mb-10">
                {CATS.map(c => (
                  <button key={c.id} onClick={() => toggleCat(c.id)}
                    className={`py-6 rounded-xl text-center transition-all border-2 ${
                      cats.includes(c.id) ? 'border-teal-500 bg-teal-50 shadow-md' : 'border-gray-100 bg-white hover:border-teal-200'
                    }`}>
                    <span className="text-3xl block mb-2">{c.emoji}</span>
                    <span className="text-sm font-semibold text-gray-700">{tCat(c.id)}</span>
                  </button>
                ))}
              </div>

              {/* Summary */}
              <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider block mb-3">{ar ? 'ملخص الرحلة' : 'Trip Summary'}</label>
              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 border border-gray-200">{days} {ar ? 'أيام' : 'days'}</span>
                  <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 border border-gray-200">{tM(String(month))}</span>
                  <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 border border-gray-200">{t(budget as 'low')}</span>
                  <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 border border-gray-200">{t(intensity)}</span>
                  {regs.map(r => <span key={r} className="px-3 py-1.5 bg-teal-50 rounded-lg text-sm font-medium text-teal-700 border border-teal-200">{REGIONS.find(x => x.id === r)?.[ar ? 'ar' : 'en']}</span>)}
                  {cats.map(c => <span key={c} className="px-3 py-1.5 bg-purple-50 rounded-lg text-sm font-medium text-purple-700 border border-purple-200">{CATS.find(x => x.id === c)?.emoji} {tCat(c)}</span>)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="shrink-0 px-4 pb-8 pt-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {canBack && (
            <button onClick={() => setStep(step - 1)}
              className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-semibold hover:bg-gray-200 transition text-base">
              {ar ? 'السابق' : 'Back'}
            </button>
          )}
          {isLast ? (
            <button onClick={generate}
              className="flex-1 py-4 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-2xl font-bold text-base hover:from-teal-700 hover:to-emerald-600 active:scale-[0.99] transition-all shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2">
              <Sparkles size={20} /> {ar ? 'أنشئ الخطة' : 'Generate Plan'}
            </button>
          ) : (
            <button onClick={() => setStep(step + 1)}
              className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-bold text-base hover:bg-teal-700 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2">
              {ar ? 'التالي' : 'Next'} <ArrowRight size={18} className={ar ? 'rotate-180' : ''} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
