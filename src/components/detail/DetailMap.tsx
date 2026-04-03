'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix Leaflet default icon issue in Next.js
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface DetailMapProps {
  lat: number;
  lng: number;
  name: string;
}

export default function DetailMap({ lat, lng, name }: DetailMapProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={12}
      style={{ height: '300px', width: '100%' }}
      className="rounded-xl z-0"
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[lat, lng]}>
        <Popup>{name}</Popup>
      </Marker>
    </MapContainer>
  );
}
