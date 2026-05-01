import type { McpContext, McpToolResult } from '../types';
import type { Destination, Region, Category } from '@/types/destination';
import { REGION_CENTERS, REGION_NAMES } from '@/lib/constants';

interface FindNearestInput {
  // One of these must be supplied:
  lat?: number;
  lng?: number;
  region?: Region;     // anchors the search at the region centroid
  category?: Category; // optional filter
  limit?: number;      // default 5
}

// Haversine distance in km
function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function findNearest(input: FindNearestInput, ctx: McpContext): McpToolResult {
  const isAr = ctx.locale === 'ar';
  let lat = input.lat;
  let lng = input.lng;

  if ((lat == null || lng == null) && input.region && REGION_CENTERS[input.region]) {
    lat = REGION_CENTERS[input.region].lat;
    lng = REGION_CENTERS[input.region].lng;
  }

  if (lat == null || lng == null) {
    return {
      info: {
        content: isAr
          ? 'محتاج إحداثياتك أو اسم المنطقة عشان ألقى الأقرب.'
          : 'I need your coordinates or a region name to find the nearest places.',
      },
    };
  }

  let pool: Destination[] = ctx.destinations;
  if (input.category) {
    pool = pool.filter((d) => d.categories.includes(input.category!));
  }

  const limit = Math.max(1, Math.min(input.limit ?? 5, 10));
  const ranked = pool
    .map((d) => ({ d, distance: distanceKm([lat as number, lng as number], [d.lat, d.lng]) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  if (ranked.length === 0) {
    return {
      destinations: [],
      info: {
        content: isAr ? 'ما لقيت وجهات قريبة بهذه المعايير.' : 'No nearby destinations match those filters.',
      },
    };
  }

  const lines = ranked.map(({ d, distance }, i) => {
    const name = isAr ? d.name.ar : d.name.en;
    const region = REGION_NAMES[d.region.en]?.[isAr ? 'ar' : 'en'] || d.region.en;
    const dist = distance < 1 ? `${Math.round(distance * 1000)} م` : `${distance.toFixed(1)} كم`;
    const distEn = distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
    return isAr
      ? `${i + 1}. ${name} (${region}) — ${dist}`
      : `${i + 1}. ${name} (${region}) — ${distEn}`;
  });

  return {
    destinations: ranked.map((r) => r.d),
    info: {
      content: (isAr ? '📍 الأقرب لك:\n' : '📍 Closest to you:\n') + lines.join('\n'),
    },
  };
}
