import type { CostBreakdown } from '@/types/itinerary';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface CostBreakdownPanelProps {
  cost: CostBreakdown;
  locale: string;
}

export default function CostBreakdownPanel({ cost, locale }: CostBreakdownPanelProps) {
  const isRtl = locale === 'ar';

  const items = [
    { label: isRtl ? 'وقود' : 'Fuel', value: cost.fuelOmr, emoji: '⛽' },
    { label: isRtl ? 'تذاكر الدخول' : 'Entry Tickets', value: cost.ticketsOmr, emoji: '🎫' },
    { label: isRtl ? 'طعام' : 'Food', value: cost.foodOmr, emoji: '🍽️' },
    { label: isRtl ? 'فندق' : 'Hotel', value: cost.hotelOmr, emoji: '🏨' },
  ];

  const tierLabel: Record<string, { en: string; ar: string }> = {
    low: { en: 'Budget', ar: 'اقتصادي' },
    medium: { en: 'Comfort', ar: 'مريح' },
    luxury: { en: 'Luxury', ar: 'فاخر' },
  };
  const tierName = tierLabel[cost.budgetTier]?.[locale as 'en' | 'ar'] ?? cost.budgetTier;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-800 mb-5 text-base">
        {isRtl ? 'تفصيل التكاليف' : 'Cost Breakdown'}
      </h3>

      {/* Tier badge */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs text-gray-500">
          {isRtl ? 'مستوى الميزانية' : 'Budget Tier'}: <strong>{tierName}</strong>
        </span>
        <span className="text-xs text-gray-400">
          {isRtl ? 'الحد' : 'Threshold'}: {cost.budgetThreshold} OMR
        </span>
      </div>

      <div className="space-y-3 mb-5">
        {items.map(({ label, value, emoji }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <span>{emoji}</span>
              {label}
            </span>
            <span className="font-semibold text-gray-800 text-sm">{value.toFixed(2)} OMR</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-800">{isRtl ? 'الإجمالي' : 'Grand Total'}</span>
          <span className="font-bold text-xl text-gray-900">{cost.grandTotal.toFixed(2)} OMR</span>
        </div>
        <div className={`flex items-center gap-2 mt-3 text-sm font-medium ${
          cost.withinBudget ? 'text-green-600' : 'text-orange-600'
        }`}>
          {cost.withinBudget
            ? <><CheckCircle size={16} /> {isRtl ? 'ضمن الميزانية' : 'Within Budget'}</>
            : <><AlertCircle size={16} /> {isRtl ? 'يتجاوز حد الميزانية' : 'Over Budget Threshold'}</>}
        </div>

        {/* Total km */}
        <div className="mt-3 text-xs text-gray-400">
          🚗 {cost.totalKm} km total
        </div>
      </div>
    </div>
  );
}
