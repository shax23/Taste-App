'use client';

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PLACE_CATEGORY_COLORS } from '@/lib/interests';

/** Decorative mini-map — zoom 15, no controls, no interaction. */
export default function MiniMapInner({
  lat,
  lng,
  category,
}: {
  lat: number;
  lng: number;
  category: string;
}) {
  const color = PLACE_CATEGORY_COLORS[category] ?? '#7A7269';
  const icon = L.divIcon({
    className: '',
    html: `<span class="taste-pin" style="background:${color}"></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 24],
  });

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      attributionControl={false}
      className="pointer-events-none h-full w-full rounded-2xl"
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      <Marker position={[lat, lng]} icon={icon} />
    </MapContainer>
  );
}
