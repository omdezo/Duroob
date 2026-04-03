'use client';

import { useTranslations } from 'next-intl';
import { Share2, Copy, Printer } from 'lucide-react';
import { useToast } from '@/components/shared/Toaster';
import type { ItineraryPlan } from '@/types/itinerary';

interface ShareActionsProps {
  plan: ItineraryPlan;
  locale: string;
}

function planToText(plan: ItineraryPlan, locale: string): string {
  const lines: string[] = [];
  const isAr = locale === 'ar';
  lines.push(isAr ? `رحلة ${plan.inputs.durationDays} أيام` : `${plan.inputs.durationDays}-Day Trip`);
  lines.push('');

  for (const day of plan.days) {
    const region = isAr ? day.regionAr : day.region;
    lines.push(isAr ? `اليوم ${day.dayNumber} — ${region}` : `Day ${day.dayNumber} — ${region}`);
    for (const stop of day.stops) {
      const name = stop.destination.name[locale as 'en' | 'ar'] ?? stop.destination.name.en;
      lines.push(`  ${stop.arrivalTime} - ${stop.departureTime}  ${name}`);
    }
    lines.push(`  ${isAr ? 'المسافة' : 'Distance'}: ${day.totalKm} km`);
    lines.push('');
  }

  lines.push(`${isAr ? 'الإجمالي' : 'Total'}: ${plan.costBreakdown.grandTotal} OMR`);
  lines.push('');
  lines.push(isAr ? 'تم التخطيط بواسطة دُروب' : 'Planned with Duroob');

  return lines.join('\n');
}

export default function ShareActions({ plan, locale }: ShareActionsProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    const text = planToText(plan, locale);
    await navigator.clipboard.writeText(text);
    toast(locale === 'ar' ? 'تم نسخ الخطة' : 'Plan copied to clipboard');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = planToText(plan, locale);
    if (navigator.share) {
      await navigator.share({
        title: locale === 'ar' ? 'رحلتي في عُمان' : 'My Oman Trip',
        text,
      });
    } else {
      await navigator.clipboard.writeText(text);
      toast(locale === 'ar' ? 'تم نسخ الخطة' : 'Plan copied to clipboard');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
        aria-label="Copy plan"
      >
        <Copy size={14} />
        <span className="hidden sm:inline">{locale === 'ar' ? 'نسخ' : 'Copy'}</span>
      </button>
      <button
        onClick={handlePrint}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
        aria-label="Print plan"
      >
        <Printer size={14} />
        <span className="hidden sm:inline">{locale === 'ar' ? 'طباعة' : 'Print'}</span>
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
        aria-label="Share plan"
      >
        <Share2 size={14} />
        <span className="hidden sm:inline">{locale === 'ar' ? 'مشاركة' : 'Share'}</span>
      </button>
    </div>
  );
}
