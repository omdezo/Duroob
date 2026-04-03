import type { McpContext, McpToolResult } from '../types';
import type { Region } from '@/types/destination';

type RecommendationContext = 'trending_now' | 'tier_for_duration' | 'best_month_for_region';

interface GetRecommendationsInput {
  context: RecommendationContext;
  duration?: number;
  region?: Region;
}

/**
 * Returns mock recommendation data. Will be replaced with real analytics later.
 */
export function getRecommendations(input: GetRecommendationsInput, ctx: McpContext): McpToolResult {
  const locale = ctx.locale;

  switch (input.context) {
    case 'trending_now': {
      const summary = locale === 'ar'
        ? 'الوجهات الرائجة حاليا: صلالة (موسم الخريف)، جبل شمس، وادي شاب، ومسقط القديمة.'
        : 'Trending now: Salalah (Khareef season), Jebel Shams, Wadi Shab, and Old Muscat.';

      return {
        recommendation: {
          summary,
          data: {
            trending: [
              { name: 'Salalah', region: 'dhofar', reason: 'Khareef season' },
              { name: 'Jebel Shams', region: 'dakhiliya', reason: 'Cool mountain weather' },
              { name: 'Wadi Shab', region: 'sharqiya', reason: 'Adventure swimming' },
              { name: 'Old Muscat', region: 'muscat', reason: 'Cultural heritage' },
            ],
          },
        },
      };
    }

    case 'tier_for_duration': {
      const days = input.duration ?? 3;
      const budgetMap: Record<number, { tier: string; omr: number }> = {
        1: { tier: 'low', omr: 25 },
        2: { tier: 'medium', omr: 80 },
        3: { tier: 'medium', omr: 120 },
        4: { tier: 'medium', omr: 180 },
        5: { tier: 'luxury', omr: 250 },
        6: { tier: 'luxury', omr: 320 },
        7: { tier: 'luxury', omr: 400 },
      };
      const rec = budgetMap[days] ?? budgetMap[3];

      const summary = locale === 'ar'
        ? `لرحلة مدتها ${days} أيام، ننصح بميزانية "${rec.tier}" بحوالي ${rec.omr} ريال عماني.`
        : `For a ${days}-day trip, we recommend a "${rec.tier}" budget tier at approximately ${rec.omr} OMR.`;

      return {
        recommendation: {
          summary,
          data: { duration: days, recommendedTier: rec.tier, estimatedOmr: rec.omr },
        },
      };
    }

    case 'best_month_for_region': {
      const regionMonths: Record<string, { best: string; months: number[]; reason: string; reasonAr: string }> = {
        muscat: {
          best: 'November - February',
          months: [11, 12, 1, 2],
          reason: 'Mild temperatures perfect for exploring the capital.',
          reasonAr: 'درجات حرارة معتدلة مثالية لاستكشاف العاصمة.',
        },
        dakhiliya: {
          best: 'October - March',
          months: [10, 11, 12, 1, 2, 3],
          reason: 'Cool highland weather ideal for mountain hikes.',
          reasonAr: 'طقس المرتفعات البارد مثالي للتنزه الجبلي.',
        },
        sharqiya: {
          best: 'November - March',
          months: [11, 12, 1, 2, 3],
          reason: 'Desert temperatures drop to comfortable levels.',
          reasonAr: 'تنخفض درجات حرارة الصحراء إلى مستويات مريحة.',
        },
        dhofar: {
          best: 'June - September',
          months: [6, 7, 8, 9],
          reason: 'Khareef monsoon season brings lush green landscapes.',
          reasonAr: 'موسم الخريف يجلب مناظر طبيعية خضراء خلابة.',
        },
        batinah: {
          best: 'November - February',
          months: [11, 12, 1, 2],
          reason: 'Coastal breezes and pleasant weather.',
          reasonAr: 'نسيم ساحلي وطقس لطيف.',
        },
        dhahira: {
          best: 'November - March',
          months: [11, 12, 1, 2, 3],
          reason: 'Moderate temperatures for exploring archaeological sites.',
          reasonAr: 'درجات حرارة معتدلة لاستكشاف المواقع الأثرية.',
        },
      };

      const region = input.region ?? 'muscat';
      const info = regionMonths[region] ?? regionMonths['muscat'];

      const summary = locale === 'ar'
        ? `أفضل وقت لزيارة ${region}: ${info.best}. ${info.reasonAr}`
        : `Best time to visit ${region}: ${info.best}. ${info.reason}`;

      return {
        recommendation: {
          summary,
          data: { region, bestMonths: info.best, months: info.months, reason: info.reason },
        },
      };
    }

    default: {
      return { error: `Unknown recommendation context: ${input.context}` };
    }
  }
}
