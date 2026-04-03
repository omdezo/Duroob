'use client';

import { useParams } from 'next/navigation';
import { Database, Pencil } from 'lucide-react';
import {
  HOTEL_RATES,
  BUDGET_THRESHOLDS,
  FUEL_PRICE_OMR,
  FOOD_PER_DAY_OMR,
} from '@/lib/planner/budgetEstimator';
import {
  MAX_DAILY_KM,
  MAX_DAILY_VISIT_MINUTES,
  MAX_STOPS,
} from '@/lib/planner/intraRegionRouter';

interface SettingRow {
  labelEn: string;
  labelAr: string;
  value: string;
  unitEn?: string;
  unitAr?: string;
}

function buildBudgetThresholdRows(): SettingRow[] {
  return [
    { labelEn: 'Low Budget Max', labelAr: 'حد الميزانية المنخفضة', value: String(BUDGET_THRESHOLDS.low), unitEn: 'OMR', unitAr: 'ر.ع' },
    { labelEn: 'Medium Budget Max', labelAr: 'حد الميزانية المتوسطة', value: String(BUDGET_THRESHOLDS.medium), unitEn: 'OMR', unitAr: 'ر.ع' },
    { labelEn: 'Luxury Budget Max', labelAr: 'حد الميزانية الفاخرة', value: String(BUDGET_THRESHOLDS.luxury), unitEn: 'OMR', unitAr: 'ر.ع' },
  ];
}

function buildHotelRateRows(): SettingRow[] {
  return [
    { labelEn: 'Low Rate', labelAr: 'سعر منخفض', value: String(HOTEL_RATES.low), unitEn: 'OMR/night', unitAr: 'ر.ع/ليلة' },
    { labelEn: 'Medium Rate', labelAr: 'سعر متوسط', value: String(HOTEL_RATES.medium), unitEn: 'OMR/night', unitAr: 'ر.ع/ليلة' },
    { labelEn: 'Luxury Rate', labelAr: 'سعر فاخر', value: String(HOTEL_RATES.luxury), unitEn: 'OMR/night', unitAr: 'ر.ع/ليلة' },
  ];
}

function buildEngineParamRows(): SettingRow[] {
  return [
    { labelEn: 'Fuel Price', labelAr: 'سعر الوقود', value: String(FUEL_PRICE_OMR), unitEn: 'OMR/L', unitAr: 'ر.ع/لتر' },
    { labelEn: 'Food Daily Budget', labelAr: 'ميزانية الطعام اليومية', value: String(FOOD_PER_DAY_OMR), unitEn: 'OMR', unitAr: 'ر.ع' },
    { labelEn: 'Max Daily Distance', labelAr: 'أقصى مسافة يومية', value: String(MAX_DAILY_KM), unitEn: 'km', unitAr: 'كم' },
    { labelEn: 'Max Visit Time', labelAr: 'أقصى وقت زيارة', value: String(MAX_DAILY_VISIT_MINUTES), unitEn: 'min', unitAr: 'دقيقة' },
  ];
}

function buildPaceLimitRows(): SettingRow[] {
  return [
    { labelEn: 'Relaxed — Max Stops', labelAr: 'مريح — أقصى محطات', value: String(MAX_STOPS.relaxed), unitEn: 'stops/day', unitAr: 'محطة/يوم' },
    { labelEn: 'Balanced — Max Stops', labelAr: 'متوازن — أقصى محطات', value: String(MAX_STOPS.balanced), unitEn: 'stops/day', unitAr: 'محطة/يوم' },
    { labelEn: 'Packed — Max Stops', labelAr: 'مكثف — أقصى محطات', value: String(MAX_STOPS.packed), unitEn: 'stops/day', unitAr: 'محطة/يوم' },
  ];
}

function SettingSection({
  titleEn,
  titleAr,
  rows,
  isRtl,
}: {
  titleEn: string;
  titleAr: string;
  rows: SettingRow[];
  isRtl: boolean;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" aria-labelledby={`section-${titleEn.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className={`px-6 py-4 border-b border-gray-100 bg-gray-50/60 ${isRtl ? 'text-right' : ''}`}>
        <h2 id={`section-${titleEn.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-semibold text-gray-900">
          {isRtl ? titleAr : titleEn}
        </h2>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map((row) => (
          <div
            key={row.labelEn}
            className={`px-6 py-3.5 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <div className={isRtl ? 'text-right' : ''}>
              <p className="text-sm text-gray-700">{isRtl ? row.labelAr : row.labelEn}</p>
            </div>
            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm font-mono font-medium text-gray-900">
                {row.value}
                {row.unitEn && (
                  <span className={`text-xs text-gray-400 ${isRtl ? 'mr-1' : 'ml-1'}`}>
                    {isRtl ? row.unitAr : row.unitEn}
                  </span>
                )}
              </span>
              <button
                disabled
                className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg hover:bg-gray-50"
                aria-disabled="true"
                aria-label={isRtl ? 'تعديل — متاح بعد ربط قاعدة البيانات' : 'Edit — coming with database'}
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const isRtl = locale === 'ar';

  return (
    <div className="space-y-6">
      <div className={isRtl ? 'text-right' : ''}>
        <h1 className="text-2xl font-bold text-gray-900">
          {isRtl ? 'إعدادات المنصة' : 'Platform Settings'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isRtl
            ? 'الإعدادات الحالية لمحرك التخطيط (للقراءة فقط)'
            : 'Current planner engine configuration (read-only)'}
        </p>
      </div>

      <div className="space-y-4">
        <SettingSection
          titleEn="Budget Thresholds"
          titleAr="حدود الميزانية"
          rows={buildBudgetThresholdRows()}
          isRtl={isRtl}
        />
        <SettingSection
          titleEn="Hotel Rates"
          titleAr="أسعار الفنادق"
          rows={buildHotelRateRows()}
          isRtl={isRtl}
        />
        <SettingSection
          titleEn="Engine Parameters"
          titleAr="معاملات المحرك"
          rows={buildEngineParamRows()}
          isRtl={isRtl}
        />
        <SettingSection
          titleEn="Pace Limits"
          titleAr="حدود وتيرة الرحلة"
          rows={buildPaceLimitRows()}
          isRtl={isRtl}
        />
      </div>

      {/* Footer note */}
      <div className={`flex items-center gap-2 text-xs text-gray-400 py-2 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
        <Database size={14} className="flex-shrink-0" aria-hidden="true" />
        <span>
          {isRtl
            ? 'ستكون الإعدادات قابلة للتعديل بعد ربط قاعدة البيانات.'
            : 'Settings will be editable after database connection.'}
        </span>
      </div>
    </div>
  );
}
