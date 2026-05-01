import type { McpContext, McpToolResult } from '../types';

interface GetAlternativesInput {
  // Identify the destination by ID, or by an exact name in either locale.
  destinationId?: string;
  destinationName?: string;
  // Optional preferences for alternative ranking
  cheaper?: boolean;
  lessCrowded?: boolean;
  limit?: number;
}

// Distance for "same area" heuristic (km).
const SAME_AREA_KM = 60;

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getAlternatives(input: GetAlternativesInput, ctx: McpContext): McpToolResult {
  const isAr = ctx.locale === 'ar';
  const all = ctx.destinations;

  const target = all.find(
    (d) =>
      (input.destinationId && d.id === input.destinationId) ||
      (input.destinationName &&
        (d.name.en.toLowerCase() === input.destinationName.toLowerCase() ||
          d.name.ar === input.destinationName)),
  );

  if (!target) {
    return {
      info: {
        content: isAr
          ? 'ما عرفت أي وجهة تقصد. حدّد لي الاسم بالضبط.'
          : "I couldn't find that destination. Could you spell the name exactly?",
      },
    };
  }

  const candidates = all.filter((d) => d.id !== target.id);
  const ranked = candidates
    .map((d) => {
      const sharedCats = d.categories.filter((c) => target.categories.includes(c)).length;
      const dKm = distanceKm(target, d);
      const sameRegion = d.region.en === target.region.en;
      const nearby = dKm <= SAME_AREA_KM;
      const cheaper = d.ticket_cost_omr < target.ticket_cost_omr;
      const less = d.crowd_level < target.crowd_level;

      let score = 0;
      score += sharedCats * 5;
      score += sameRegion ? 4 : 0;
      score += nearby ? 2 : 0;
      if (input.cheaper && cheaper) score += 3;
      if (input.lessCrowded && less) score += 3;
      // Default soft preference: less crowded + similar/cheaper
      if (less) score += 1;
      if (d.ticket_cost_omr <= target.ticket_cost_omr) score += 1;
      return { d, score, distance: dKm };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.distance - b.distance)
    .slice(0, Math.max(1, Math.min(input.limit ?? 3, 5)));

  if (ranked.length === 0) {
    return {
      info: {
        content: isAr
          ? 'ما لقيت بدائل قوية. جرّب توسيع الخيارات.'
          : "Couldn't find strong alternatives. Try broadening the criteria.",
      },
    };
  }

  const targetName = isAr ? target.name.ar : target.name.en;
  const lines = ranked.map((r, i) => {
    const name = isAr ? r.d.name.ar : r.d.name.en;
    const cost = r.d.ticket_cost_omr === 0 ? (isAr ? 'مجاني' : 'Free') : `${r.d.ticket_cost_omr} OMR`;
    const crowd = `${r.d.crowd_level}/5`;
    return isAr
      ? `${i + 1}. ${name} — ${cost} · زحام ${crowd} · ${r.distance.toFixed(0)} كم بعيد`
      : `${i + 1}. ${name} — ${cost} · crowd ${crowd} · ${r.distance.toFixed(0)} km away`;
  });

  return {
    destinations: ranked.map((r) => r.d),
    info: {
      content:
        (isAr ? `🔄 بدائل لـ ${targetName}:\n` : `🔄 Alternatives to ${targetName}:\n`) +
        lines.join('\n'),
    },
  };
}
