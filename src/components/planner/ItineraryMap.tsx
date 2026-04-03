'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { DayPlan } from '@/types/itinerary';

function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const DAY_COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899'];

const ACTIVE_ICON = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface ItineraryMapProps {
  days: DayPlan[];
  activeDay: number;
  activeStopIndex: number | null;
  locale: string;
}

export default function ItineraryMap({ days, activeDay, activeStopIndex, locale }: ItineraryMapProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const activeDayPlan = days.find((d) => d.dayNumber === activeDay);
  if (!activeDayPlan || activeDayPlan.stops.length === 0) return null;

  const polylinePoints = activeDayPlan.stops.map((s) => [s.destination.lat, s.destination.lng] as [number, number]);
  const color = DAY_COLORS[(activeDay - 1) % DAY_COLORS.length];

  // Center map on first stop of the active day
  const center = polylinePoints[0];
  const isRtl = locale === 'ar';

  return (
    <div className="space-y-2">
      {/* Day switcher */}
      <div className="flex gap-2 flex-wrap">
        {days.map((day) => {
          const dc = DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length];
          return (
            <button
              key={day.dayNumber}
              onClick={() => {/* handled by parent */}}
              disabled
              style={{ borderColor: day.dayNumber === activeDay ? dc : 'transparent', color: day.dayNumber === activeDay ? dc : '#6b7280' }}
              className={`px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all ${
                day.dayNumber === activeDay ? 'font-bold' : 'bg-gray-100'
              }`}
            >
              {isRtl ? `يوم ${day.dayNumber}` : `Day ${day.dayNumber}`}
            </button>
          );
        })}
      </div>

      <MapContainer
        key={activeDay} // remount when day changes to re-center
        center={center}
        zoom={10}
        style={{ height: '380px', width: '100%' }}
        className="rounded-xl z-0"
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Route polyline */}
        <Polyline
          positions={polylinePoints}
          color={color}
          weight={3}
          opacity={0.8}
          dashArray="6 4"
        />

        {/* Markers */}
        {activeDayPlan.stops.map((stop, idx) => {
          const name = stop.destination.name[locale as 'en' | 'ar'] ?? stop.destination.name.en;
          const isActiveMarker = activeStopIndex === idx;
          return (
            <Marker
              key={stop.destination.id}
              position={[stop.destination.lat, stop.destination.lng]}
              icon={isActiveMarker ? ACTIVE_ICON : L.Icon.Default.prototype}
              zIndexOffset={isActiveMarker ? 1000 : 0}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{idx + 1}. {name}</strong>
                  <br />
                  <span className="text-gray-500">{stop.arrivalTime} – {stop.departureTime}</span>
                  <br />
                  <span className="text-xs text-gray-400">
                    {stop.destination.avg_visit_duration_minutes} min visit
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
