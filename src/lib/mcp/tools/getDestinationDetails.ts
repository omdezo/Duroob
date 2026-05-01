import type { McpContext, McpToolResult } from '../types';
import { REGION_NAMES } from '@/lib/constants';

interface GetDestinationDetailsInput {
  destinationId?: string;
  destinationName?: string;
}

export function getDestinationDetails(input: GetDestinationDetailsInput, ctx: McpContext): McpToolResult {
  const isAr = ctx.locale === 'ar';
  const all = ctx.destinations;

  const dest = all.find(
    (d) =>
      (input.destinationId && d.id === input.destinationId) ||
      (input.destinationName &&
        (d.name.en.toLowerCase() === input.destinationName.toLowerCase() ||
          d.name.ar === input.destinationName)),
  );

  if (!dest) {
    return {
      info: {
        content: isAr
          ? 'ما لقيت هذه الوجهة. حدّد الاسم بالضبط أو اطلب قائمة الوجهات في المنطقة.'
          : "I couldn't find that destination. Spell the name exactly or ask for a region's list.",
      },
    };
  }

  const name = isAr ? dest.name.ar : dest.name.en;
  const region = REGION_NAMES[dest.region.en]?.[isAr ? 'ar' : 'en'] || dest.region.en;
  const cost = dest.ticket_cost_omr === 0 ? (isAr ? 'مجاني' : 'Free') : `${dest.ticket_cost_omr} OMR`;
  const visitH = Math.floor(dest.avg_visit_duration_minutes / 60);
  const visitM = dest.avg_visit_duration_minutes % 60;
  const visit = visitH > 0 ? `${visitH}h ${visitM > 0 ? `${visitM}m` : ''}` : `${visitM}m`;
  const monthNamesEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthNamesAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const months = (dest.recommended_months || [])
    .map((m) => (isAr ? monthNamesAr[m - 1] : monthNamesEn[m - 1]))
    .join(isAr ? '، ' : ', ');
  const cats = dest.categories.join(isAr ? '، ' : ', ');

  const content = isAr
    ? `📍 **${name}** — ${region}\n\n` +
      `• المدة المتوقعة: ${visit}\n` +
      `• التكلفة: ${cost}\n` +
      `• مستوى الزحام: ${dest.crowd_level}/5\n` +
      `• الفئات: ${cats}\n` +
      `• أفضل الأشهر: ${months || 'مناسب طوال السنة'}`
    : `📍 **${name}** — ${region}\n\n` +
      `• Visit duration: ${visit}\n` +
      `• Entry: ${cost}\n` +
      `• Crowd level: ${dest.crowd_level}/5\n` +
      `• Categories: ${cats}\n` +
      `• Best months: ${months || 'Year-round'}`;

  return {
    destinations: [dest],
    info: { content },
  };
}
