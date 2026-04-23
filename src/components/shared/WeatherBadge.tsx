'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

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

interface WeatherBadgeProps {
  region?: string;
  lat?: number;
  lng?: number;
  locale: string;
  compact?: boolean;
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

export default function WeatherBadge({ region, lat, lng, locale, compact = false }: WeatherBadgeProps) {
  const ar = locale === 'ar';
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = region
      ? `region=${region}`
      : (lat != null && lng != null ? `lat=${lat}&lng=${lng}` : '');
    if (!qs) {
      setLoading(false);
      return;
    }
    fetch(`/api/weather?${qs}`)
      .then((r) => r.json())
      .then((data) => setWeather(data.weather ?? null))
      .catch(() => setWeather(null))
      .finally(() => setLoading(false));
  }, [region, lat, lng]);

  if (loading) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-gray-400 ${compact ? '' : 'px-2 py-1 bg-gray-50 rounded-full'}`}>
        <span className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
      </span>
    );
  }
  if (!weather) return null;

  const tone = weather.rain
    ? 'bg-blue-50 text-blue-700 border-blue-100'
    : weather.hot
      ? 'bg-orange-50 text-orange-700 border-orange-100'
      : 'bg-sky-50 text-sky-700 border-sky-100';

  const label = ar ? (LABEL_AR[weather.label] || weather.label) : weather.label;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${tone}`}>
        <span>{weather.emoji}</span>
        <span className="font-medium">{weather.tempC}°</span>
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${tone}`}>
        <span className="text-base leading-none">{weather.emoji}</span>
        <span>{weather.tempC}°C</span>
        <span className="text-[10px] opacity-75">· {label}</span>
      </span>
      {weather.alert && (
        <div className="flex items-start gap-1.5 text-[11px] text-orange-700 bg-orange-50 border border-orange-100 rounded-md px-2 py-1">
          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
          <span>
            {ar
              ? (weather.rain
                  ? 'مطر متوقع — قد تتأثر بعض الوقفات الخارجية.'
                  : 'حر شديد — اشرب الماء وفضّل الصباح الباكر أو المساء.')
              : weather.alert}
          </span>
        </div>
      )}
    </div>
  );
}
