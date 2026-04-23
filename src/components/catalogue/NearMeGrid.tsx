'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPinned, Loader2, X } from 'lucide-react';
import type { Destination } from '@/types/destination';
import DestinationCard from '@/components/marketing/DestinationCard';
import SaveButton from './SaveButton';

interface NearMeGridProps {
  destinations: Destination[];
  locale: string;
}

// Haversine distance in km between two coords
function haversineKm(a: [number, number], b: [number, number]): number {
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

export default function NearMeGrid({ destinations, locale }: NearMeGridProps) {
  const t = useTranslations('destinations');
  const ar = locale === 'ar';
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function requestLocation() {
    if (!('geolocation' in navigator)) {
      setError(ar ? 'المتصفح لا يدعم تحديد الموقع' : 'Your browser does not support geolocation');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError(ar ? 'تم رفض إذن الموقع. فعّله من إعدادات المتصفح.' : 'Location permission denied. Enable it in your browser settings.');
        } else {
          setError(ar ? 'تعذّر تحديد موقعك.' : 'Could not determine your location.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }

  function clearLocation() {
    setCoords(null);
    setError('');
  }

  const sorted = useMemo(() => {
    if (!coords) return destinations;
    return [...destinations]
      .map((d) => ({ d, distance: haversineKm(coords, [d.lat, d.lng]) }))
      .sort((a, b) => a.distance - b.distance);
  }, [coords, destinations]);

  if (destinations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-gray-500 text-lg">{t('noResults')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Near-me control */}
      <div className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl p-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <MapPinned size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">
              {ar ? 'الأقرب لي' : 'Near Me'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {coords
                ? (ar ? 'مرتّبة حسب المسافة من موقعك' : 'Sorted by distance from your location')
                : (ar ? 'رتّب الوجهات حسب قربها منك' : 'Sort destinations by how close they are')}
            </p>
          </div>
        </div>
        {coords ? (
          <button
            onClick={clearLocation}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition shrink-0"
          >
            <X size={14} />
            {ar ? 'إيقاف' : 'Disable'}
          </button>
        ) : (
          <button
            onClick={requestLocation}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition disabled:opacity-60 shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <MapPinned size={14} />}
            {ar ? 'استخدم موقعي' : 'Use My Location'}
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {sorted.map((item) => {
          const dest = 'd' in item ? item.d : item;
          const distance = 'distance' in item ? item.distance : null;
          return (
            <div key={dest.id} className="relative">
              <DestinationCard destination={dest} locale={locale} />
              <div className="absolute top-[155px] end-3 z-10">
                <SaveButton destinationId={dest.id} locale={locale} />
              </div>
              {distance != null && (
                <div className="absolute top-3 start-16 z-10">
                  <span className="inline-flex items-center gap-1 bg-teal-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                    <MapPinned size={11} />
                    {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
