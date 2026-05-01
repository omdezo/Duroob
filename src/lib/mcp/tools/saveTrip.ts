import type { McpContext, McpToolResult } from '../types';
import { getDb } from '@/db';

interface SaveTripInput {
  title?: string;
  // The plan + scores come from the current context (last generated plan).
}

export async function saveTrip(input: SaveTripInput, ctx: McpContext): Promise<McpToolResult> {
  const isAr = ctx.locale === 'ar';

  if (!ctx.currentPlan) {
    return {
      info: {
        content: isAr
          ? 'لا توجد خطة محفوظة في المحادثة الحالية. اطلب مني تخطيط رحلة أولاً.'
          : "There's no plan in this conversation yet. Ask me to plan a trip first.",
      },
    };
  }

  try {
    const sql = getDb();
    const userId = ctx.userId ?? null;
    const userEmail = ctx.userEmail ?? 'guest';
    const days = ctx.currentPlan.days.length;
    const title = input.title?.trim() || (isAr ? `رحلة ${days} أيام` : `${days}-day trip`);

    const rows = await sql`
      INSERT INTO saved_trips (user_id, title, inputs_json, plan_json, scores_json)
      VALUES (
        ${userId},
        ${title},
        ${JSON.stringify(ctx.currentPlan.inputs)},
        ${JSON.stringify(ctx.currentPlan)},
        ${JSON.stringify(ctx.currentScores ?? {})}
      )
      RETURNING id
    `;
    const tripId = rows[0]?.id as string;

    await sql`
      INSERT INTO audit_log (admin_email, action, target_type, target_id, details)
      VALUES (${userEmail}, 'trip_saved_via_chat', 'trip', ${tripId}, ${'Saved via agent: ' + title})
    `;

    return {
      saved: { tripId },
      info: {
        content: isAr
          ? `تم حفظ "${title}" في رحلاتك. تقدر تلقاها في صفحة "رحلاتي".`
          : `Saved "${title}" to your trips. You can find it on the My Trips page.`,
      },
    };
  } catch (err) {
    console.error('saveTrip error:', err);
    return {
      info: {
        content: isAr
          ? 'تعذّر حفظ الرحلة الآن، حاول مرة ثانية.'
          : 'Could not save the trip right now. Please try again.',
      },
    };
  }
}
