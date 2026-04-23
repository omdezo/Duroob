import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { REGION_CENTERS } from '@/lib/constants';

// Simple in-memory cache — weather doesn't change by the second.
// Serverless instances may not share, but that's fine; worst case we hit Open-Meteo more.
const cache = new Map<string, { data: WeatherSummary; ts: number }>();
const TTL_MS = 30 * 60 * 1000; // 30 minutes

interface WeatherSummary {
  tempC: number;
  feelsLikeC: number;
  code: number;
  label: string;
  emoji: string;
  rain: boolean;
  hot: boolean;
  alert?: string;
}

// Map Open-Meteo WMO codes → user-friendly label + emoji.
// https://open-meteo.com/en/docs
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

async function fetchWeather(lat: number, lng: number): Promise<WeatherSummary | null> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const json = await res.json();
    const c = json.current;
    if (!c) return null;

    const tempC = Math.round(c.temperature_2m);
    const feelsLikeC = Math.round(c.apparent_temperature);
    const { label, emoji, rain } = decodeWmo(c.weather_code);
    const hot = tempC >= 40;

    let alert: string | undefined;
    if (rain) alert = 'Rain expected — some outdoor stops may be affected.';
    else if (hot) alert = 'Extreme heat — drink water & prefer early or late visits.';

    const summary: WeatherSummary = { tempC, feelsLikeC, code: c.weather_code, label, emoji, rain, hot, alert };
    cache.set(key, { data: summary, ts: Date.now() });
    return summary;
  } catch {
    return null;
  }
}

// GET /api/weather?region=muscat     → single region
// GET /api/weather?regions=muscat,dhofar  → batch
// GET /api/weather?lat=23.5&lng=58.4  → raw coords
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region');
  const regions = searchParams.get('regions');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (regions) {
    const list = regions.split(',').map((r) => r.trim()).filter(Boolean);
    const result: Record<string, WeatherSummary | null> = {};
    await Promise.all(
      list.map(async (r) => {
        const c = REGION_CENTERS[r];
        result[r] = c ? await fetchWeather(c.lat, c.lng) : null;
      }),
    );
    return NextResponse.json({ regions: result });
  }

  if (region) {
    const c = REGION_CENTERS[region];
    if (!c) return NextResponse.json({ error: 'Unknown region' }, { status: 400 });
    const data = await fetchWeather(c.lat, c.lng);
    return NextResponse.json({ region, weather: data });
  }

  if (lat && lng) {
    const data = await fetchWeather(parseFloat(lat), parseFloat(lng));
    return NextResponse.json({ weather: data });
  }

  return NextResponse.json({ error: 'region or lat/lng required' }, { status: 400 });
}
