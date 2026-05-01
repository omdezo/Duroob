import type { McpContext, McpToolResult } from '../types';
import { REGION_CENTERS, REGION_NAMES } from '@/lib/constants';

interface GetWeatherInput {
  region?: string;
  lat?: number;
  lng?: number;
}

// Cache shared with /api/weather — but agent runs in-process so a local cache is fine.
const cache = new Map<string, { data: WeatherSummary; ts: number }>();
const TTL_MS = 30 * 60 * 1000;

interface WeatherSummary {
  tempC: number;
  feelsLikeC: number;
  code: number;
  label: string;
  emoji: string;
  rain: boolean;
  hot: boolean;
}

function decodeWmo(code: number): { label: string; emoji: string; rain: boolean } {
  if (code === 0) return { label: 'Clear', emoji: '☀️', rain: false };
  if (code <= 3) return { label: 'Partly Cloudy', emoji: '⛅', rain: false };
  if (code <= 48) return { label: 'Foggy', emoji: '🌫️', rain: false };
  if (code <= 67) return { label: 'Rainy', emoji: '🌧️', rain: true };
  if (code <= 77) return { label: 'Snow', emoji: '❄️', rain: true };
  if (code <= 82) return { label: 'Showers', emoji: '🌦️', rain: true };
  if (code <= 99) return { label: 'Thunderstorm', emoji: '⛈️', rain: true };
  return { label: 'Unknown', emoji: '🌡️', rain: false };
}

const LABEL_AR: Record<string, string> = {
  Clear: 'صحو',
  'Partly Cloudy': 'غائم جزئياً',
  Foggy: 'ضباب',
  Rainy: 'ممطر',
  Snow: 'ثلج',
  Showers: 'زخات مطر',
  Thunderstorm: 'عاصفة رعدية',
  Unknown: '—',
};

async function fetchLiveWeather(lat: number, lng: number): Promise<WeatherSummary | null> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    const c = json.current;
    if (!c) return null;
    const decoded = decodeWmo(c.weather_code);
    const summary: WeatherSummary = {
      tempC: Math.round(c.temperature_2m),
      feelsLikeC: Math.round(c.apparent_temperature),
      code: c.weather_code,
      label: decoded.label,
      emoji: decoded.emoji,
      rain: decoded.rain,
      hot: Math.round(c.temperature_2m) >= 40,
    };
    cache.set(key, { data: summary, ts: Date.now() });
    return summary;
  } catch {
    return null;
  }
}

export async function getWeather(input: Record<string, any>, ctx: McpContext): Promise<McpToolResult> {
  const isAr = ctx.locale === 'ar';
  let lat = input.lat;
  let lng = input.lng;
  let regionLabel = '';

  if (input.region && REGION_CENTERS[input.region]) {
    const c = REGION_CENTERS[input.region];
    lat = c.lat;
    lng = c.lng;
    regionLabel = REGION_NAMES[input.region]?.[isAr ? 'ar' : 'en'] || input.region;
  }

  if (lat == null || lng == null) {
    return {
      info: {
        content: isAr
          ? 'لمعرفة الطقس أحتاج تحديد منطقة. مناطقنا: مسقط، الداخلية، الشرقية، ظفار، الباطنة، الظاهرة.'
          : "I need a region to fetch weather. Our regions: Muscat, Dakhiliya, Sharqiya, Dhofar, Batinah, Dhahira.",
      },
    };
  }

  const w = await fetchLiveWeather(lat, lng);
  if (!w) {
    return {
      info: {
        content: isAr
          ? `تعذّر جلب الطقس الآن لـ${regionLabel || 'هذه المنطقة'}. حاول بعد قليل.`
          : `Could not fetch live weather for ${regionLabel || 'this location'} right now. Try again shortly.`,
      },
    };
  }

  const labelAr = LABEL_AR[w.label] || w.label;
  const where = regionLabel || (isAr ? 'الموقع المحدد' : 'this location');

  let advice = '';
  if (w.rain) {
    advice = isAr
      ? '\n\n💡 مطر متوقع — قد تتأثر الوقفات الخارجية. خليك في الأماكن المسقوفة أو القلاع.'
      : "\n\n💡 Rain expected — outdoor stops may be affected. Indoor sites or forts are a good call.";
  } else if (w.hot) {
    advice = isAr
      ? '\n\n💡 حر شديد — اشرب الماء وفضّل الزيارات الصباح الباكر أو بعد العصر.'
      : '\n\n💡 Extreme heat — drink water and prefer early-morning or late-afternoon visits.';
  } else if (w.tempC <= 22) {
    advice = isAr
      ? '\n\n💡 الطقس لطيف — وقت ممتاز للنزهات الخارجية والمشي.'
      : '\n\n💡 Pleasant weather — perfect for hikes and outdoor exploration.';
  }

  const content = isAr
    ? `${w.emoji} الطقس الآن في ${where}: ${w.tempC}°م (الإحساس ${w.feelsLikeC}°م) — ${labelAr}.${advice}`
    : `${w.emoji} Current weather in ${where}: ${w.tempC}°C (feels like ${w.feelsLikeC}°C) — ${w.label}.${advice}`;

  return { info: { content } };
}
