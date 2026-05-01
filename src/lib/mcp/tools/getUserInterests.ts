import type { McpContext, McpToolResult } from '../types';
import { getDb } from '@/db';
import { REGION_NAMES } from '@/lib/constants';

interface GetUserInterestsInput {
  // No input — uses ctx.userId
}

export async function getUserInterests(_input: GetUserInterestsInput, ctx: McpContext): Promise<McpToolResult> {
  const isAr = ctx.locale === 'ar';

  if (!ctx.userId) {
    return {
      info: {
        content: isAr
          ? 'سجّل دخولك عشان أقدر أشوف اهتماماتك المحفوظة وأقترح عليك بناءً عليها.'
          : 'Sign in so I can see your saved interests and tailor suggestions.',
      },
    };
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT destination_id FROM saved_interests WHERE user_id = ${ctx.userId}
    `;
    const ids = new Set(rows.map((r: any) => r.destination_id as string));
    const saved = ctx.destinations.filter((d) => ids.has(d.id));

    if (saved.length === 0) {
      return {
        info: {
          content: isAr
            ? 'ما عندك وجهات محفوظة لحد الآن. احفظ وجهات من صفحة "الوجهات" وراح أقترح عليك بناءً عليها.'
            : "You haven't saved any destinations yet. Save a few from the Destinations page and I'll personalise suggestions.",
        },
      };
    }

    const cats = [...new Set(saved.flatMap((d) => d.categories))];
    const regions = [...new Set(saved.map((d) => d.region.en))];

    const namesList = saved.slice(0, 5).map((d) => (isAr ? d.name.ar : d.name.en)).join(isAr ? '، ' : ', ');
    const regionsList = regions.map((r) => REGION_NAMES[r]?.[isAr ? 'ar' : 'en'] || r).join(isAr ? '، ' : ', ');
    const catsList = cats.join(isAr ? '، ' : ', ');

    return {
      destinations: saved,
      info: {
        content: isAr
          ? `❤️ عندك ${saved.length} وجهة محفوظة (${namesList}${saved.length > 5 ? '…' : ''}).\nالمناطق: ${regionsList}.\nالفئات المفضلة: ${catsList}.\n\nأقدر أخطط لك رحلة بناءً عليها — قول "خطط لي رحلة من اهتماماتي".`
          : `❤️ You have ${saved.length} saved destinations (${namesList}${saved.length > 5 ? '…' : ''}).\nRegions: ${regionsList}.\nPreferred categories: ${catsList}.\n\nI can plan a trip around these — say "plan a trip from my interests".`,
      },
    };
  } catch (err) {
    console.error('getUserInterests error:', err);
    return {
      info: {
        content: isAr ? 'تعذّر قراءة اهتماماتك الآن.' : "Couldn't read your saved interests right now.",
      },
    };
  }
}
