import type { McpToolResult } from '../types';

// ─── Template helpers ───────────────────────────────────────────────────────

const REGION_AR: Record<string, string> = {
  muscat: 'مسقط', dakhiliya: 'الداخلية', sharqiya: 'الشرقية',
  dhofar: 'ظفار', batinah: 'الباطنة', dhahira: 'الظاهرة',
};

function uniqueRegions(result: McpToolResult, locale: string = 'en'): string[] {
  if (!result.plan) return [];
  const regions = new Set(result.plan.days.map((d) =>
    locale === 'ar' ? (d.regionAr || REGION_AR[d.region] || d.region) : d.region
  ));
  return [...regions];
}

function totalStops(result: McpToolResult): number {
  if (!result.plan) return 0;
  return result.plan.days.reduce((sum, d) => sum + d.stops.length, 0);
}

function formatChanges(changes: McpToolResult['changes'], locale: string): string {
  if (!changes || changes.length === 0) return '';

  return changes
    .map((c) => {
      if (c.day === 0) {
        return locale === 'ar'
          ? `${c.removed} -> ${c.added}`
          : `${c.removed} -> ${c.added}`;
      }
      return locale === 'ar'
        ? `يوم ${c.day}: تم استبدال "${c.removed}" بـ "${c.added}"`
        : `Day ${c.day}: removed "${c.removed}", added "${c.added}"`;
    })
    .join('. ');
}

// ─── Templates ──────────────────────────────────────────────────────────────

type ToolName = 'plan_trip' | 'modify_plan' | 'search_destinations' | 'get_recommendations' | 'get_travel_info';

interface TemplateSet {
  en: (result: McpToolResult) => string;
  ar: (result: McpToolResult) => string;
}

const TEMPLATES: Record<ToolName, TemplateSet> = {
  plan_trip: {
    en: (result) => {
      if (!result.plan) return 'Failed to generate a plan.';
      const days = result.plan.inputs.durationDays;
      const stops = totalStops(result);
      const regions = uniqueRegions(result);
      const cost = result.plan.costBreakdown.grandTotal;
      const overall = result.scores?.overall ?? 'N/A';
      return `Here's your ${days}-day trip! ${stops} stops across ${regions.length} region${regions.length !== 1 ? 's' : ''} (${regions.join(', ')}). Total: ${cost} OMR. Overall rating: ${overall}.`;
    },
    ar: (result) => {
      if (!result.plan) return 'فشل في إنشاء الخطة.';
      const days = result.plan.inputs.durationDays;
      const stops = totalStops(result);
      const regions = uniqueRegions(result, 'ar');
      const cost = result.plan.costBreakdown.grandTotal;
      const overall = result.scores?.overall ?? 'غير محدد';
      const overallAr = overall === 'excellent' ? 'ممتاز' : overall === 'good' ? 'جيد' : 'مقبول';
      return `إليك رحلتك لمدة ${days} أيام! ${stops} محطة عبر ${regions.length} منطقة (${regions.join('، ')}). المجموع: ${cost} ر.ع. التقييم: ${overallAr}.`;
    },
  },

  modify_plan: {
    en: (result) => {
      if (result.error) return `Could not modify the plan: ${result.error}`;
      const changesStr = formatChanges(result.changes, 'en');
      return changesStr ? `Updated! ${changesStr}` : 'Plan updated!';
    },
    ar: (result) => {
      if (result.error) return `تعذر تعديل الخطة: ${result.error}`;
      const changesStr = formatChanges(result.changes, 'ar');
      return changesStr ? `تم التحديث! ${changesStr}` : 'تم تحديث الخطة!';
    },
  },

  search_destinations: {
    en: (result) => {
      const count = result.destinations?.length ?? 0;
      if (count === 0) return 'No destinations found matching your criteria.';
      const names = result.destinations!.slice(0, 5).map((d) => d.name.en).join(', ');
      const more = count > 5 ? ` and ${count - 5} more` : '';
      return `Found ${count} destination${count !== 1 ? 's' : ''}: ${names}${more}.`;
    },
    ar: (result) => {
      const count = result.destinations?.length ?? 0;
      if (count === 0) return 'لم يتم العثور على وجهات تطابق معاييرك.';
      const names = result.destinations!.slice(0, 5).map((d) => d.name.ar).join('، ');
      const more = count > 5 ? ` و${count - 5} أخرى` : '';
      return `تم العثور على ${count} وجهة: ${names}${more}.`;
    },
  },

  get_recommendations: {
    en: (result) => {
      return result.recommendation?.summary ?? 'No recommendations available.';
    },
    ar: (result) => {
      return result.recommendation?.summary ?? 'لا توجد توصيات متاحة.';
    },
  },

  get_travel_info: {
    en: (result) => {
      return result.info?.content ?? 'No information available for this topic.';
    },
    ar: (result) => {
      return result.info?.content ?? 'لا تتوفر معلومات حول هذا الموضوع.';
    },
  },
};

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Format a tool result into a human-readable string using locale-aware templates.
 * Works entirely offline with no external dependencies.
 */
export function formatWithTemplate(
  toolName: string,
  result: McpToolResult,
  locale: string,
): string {
  // Handle errors first
  if (result.error) {
    return locale === 'ar'
      ? `حدث خطأ: ${result.error}`
      : `Error: ${result.error}`;
  }

  const template = TEMPLATES[toolName as ToolName];
  if (!template) {
    return locale === 'ar'
      ? `تم تنفيذ الأداة "${toolName}" بنجاح.`
      : `Tool "${toolName}" executed successfully.`;
  }

  const formatter = locale === 'ar' ? template.ar : template.en;
  return formatter(result);
}
