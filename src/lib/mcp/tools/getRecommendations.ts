import type { McpContext, McpToolResult } from '../types';
import type { Region } from '@/types/destination';
import { getDb } from '@/db';
import { REGION_NAMES } from '@/lib/constants';

type RecommendationContext = 'trending_now' | 'tier_for_duration' | 'best_month_for_region';

interface GetRecommendationsInput {
  context: RecommendationContext;
  duration?: number;
  region?: Region;
}

const MONTH_NAMES_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

/**
 * Real, DB-backed recommendations. Reads `trip_analytics` (every plan
 * generated in the last 30 days) and `saved_interests` to surface what
 * Duroob users are actually choosing right now.
 */
export async function getRecommendations(input: GetRecommendationsInput, ctx: McpContext): Promise<McpToolResult> {
  const isAr = ctx.locale === 'ar';
  const sql = getDb();

  switch (input.context) {
    case 'trending_now': {
      // Top regions by trip count in the last 30 days, then top destinations
      // by saved-interest count among admin-active destinations.
      try {
        const regionRows = await sql`
          SELECT unnest(regions) AS region, count(*)::int AS cnt
          FROM trip_analytics
          WHERE created_at > now() - INTERVAL '30 days'
          GROUP BY region
          ORDER BY cnt DESC
          LIMIT 4
        `;
        const interestRows = await sql`
          SELECT si.destination_id, count(*)::int AS cnt
          FROM saved_interests si
          JOIN destinations d ON d.id = si.destination_id
          WHERE d.is_active = TRUE
          GROUP BY si.destination_id
          ORDER BY cnt DESC
          LIMIT 5
        `;

        const trendingRegions = regionRows.map((r: any) => ({
          region: r.region as string,
          name: REGION_NAMES[r.region]?.[isAr ? 'ar' : 'en'] || r.region,
          count: Number(r.cnt),
        }));

        const trendingDests = interestRows
          .map((r: any) => {
            const d = ctx.destinations.find((x) => x.id === r.destination_id);
            return d ? { id: d.id, name: isAr ? d.name.ar : d.name.en, count: Number(r.cnt) } : null;
          })
          .filter(Boolean);

        if (trendingRegions.length === 0 && trendingDests.length === 0) {
          // Cold start — fall back to lowest-crowd destinations
          const fallback = [...ctx.destinations]
            .sort((a, b) => a.crowd_level - b.crowd_level)
            .slice(0, 4);
          const names = fallback.map((d) => (isAr ? d.name.ar : d.name.en)).join(isAr ? '، ' : ', ');
          return {
            recommendation: {
              summary: isAr
                ? `وجهات هادئة ومحبوبة: ${names}.`
                : `Quiet, well-loved spots: ${names}.`,
              data: { regions: [], destinations: fallback.map((d) => ({ id: d.id })) },
            },
          };
        }

        const regionLine = trendingRegions
          .map((r) => `${r.name} (${r.count}${isAr ? ' رحلات' : ''})`)
          .join(isAr ? '، ' : ', ');
        const destsLine = trendingDests
          .map((d: any) => `${d.name} (${d.count}❤)`)
          .join(isAr ? '، ' : ', ');

        const summary = isAr
          ? `📈 الأكثر رواجاً هذا الشهر:\n• المناطق: ${regionLine || '—'}\n• الوجهات الأكثر حفظاً: ${destsLine || '—'}`
          : `📈 Trending this month:\n• Regions: ${regionLine || '—'}\n• Most-saved destinations: ${destsLine || '—'}`;

        return {
          recommendation: {
            summary,
            data: { regions: trendingRegions, destinations: trendingDests },
          },
        };
      } catch (err) {
        console.error('getRecommendations trending_now error:', err);
        return {
          recommendation: {
            summary: isAr
              ? 'الأكثر رواجاً عادةً: مسقط، ظفار (في الخريف)، نزوى.'
              : 'Usual favourites: Muscat, Dhofar (in Khareef), Nizwa.',
            data: {},
          },
        };
      }
    }

    case 'tier_for_duration': {
      try {
        const days = input.duration ?? 3;
        const rows = await sql`
          SELECT tier, count(*)::int AS cnt, avg(total_cost)::float AS avg_cost
          FROM trip_analytics
          WHERE duration = ${days}
            AND created_at > now() - INTERVAL '90 days'
          GROUP BY tier
          ORDER BY cnt DESC
          LIMIT 1
        `;
        const top = rows[0] as any;
        if (!top) {
          return {
            recommendation: {
              summary: isAr
                ? `لرحلة ${days} أيام، أنصح بمستوى "متوسط" — متوازن بين السعر والراحة.`
                : `For a ${days}-day trip, I recommend the "medium" tier — balanced cost and comfort.`,
              data: { tier: 'medium' },
            },
          };
        }
        return {
          recommendation: {
            summary: isAr
              ? `🎯 لرحلة ${days} أيام، الأكثر اختياراً: المستوى "${top.tier}" بمتوسط ${Math.round(top.avg_cost)} ر.ع.`
              : `🎯 For ${days}-day trips, the most chosen tier is "${top.tier}" averaging ${Math.round(top.avg_cost)} OMR.`,
            data: { tier: top.tier as string, avgCost: top.avg_cost },
          },
        };
      } catch (err) {
        console.error('getRecommendations tier_for_duration error:', err);
        return {
          recommendation: {
            summary: isAr ? 'أنصح بالمستوى المتوسط.' : 'Medium tier is a safe pick.',
            data: { tier: 'medium' },
          },
        };
      }
    }

    case 'best_month_for_region': {
      const region = input.region;
      const dests = region ? ctx.destinations.filter((d) => d.region.en === region) : ctx.destinations;
      if (dests.length === 0) {
        return {
          recommendation: {
            summary: isAr ? 'ما لقيت بيانات كافية للمنطقة.' : "Not enough data for that region.",
            data: {},
          },
        };
      }
      // Tally recommended months across destinations
      const counts = new Array(13).fill(0);
      for (const d of dests) for (const m of d.recommended_months || []) counts[m]++;
      const ranked = counts
        .map((c, m) => ({ month: m, count: c }))
        .filter((x) => x.month > 0 && x.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      const list = ranked.map((r) => (isAr ? MONTH_NAMES_AR[r.month - 1] : MONTH_NAMES_EN[r.month - 1])).join(isAr ? '، ' : ', ');
      const regionLabel = region ? REGION_NAMES[region]?.[isAr ? 'ar' : 'en'] || region : (isAr ? 'عُمان' : 'Oman');
      return {
        recommendation: {
          summary: isAr
            ? `🌤 أفضل أشهر لزيارة ${regionLabel}: ${list}.`
            : `🌤 Best months to visit ${regionLabel}: ${list}.`,
          data: { months: ranked },
        },
      };
    }
  }
}
