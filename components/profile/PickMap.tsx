'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { categoryMeta } from '@/lib/taste';

export type PickPin = {
  rank: number;
  name: string;
  note: string | null;
  category: string;
  neighborhood: string | null;
  lat: number;
  lng: number;
  shared: boolean; // on the viewer's list too
};

function pinIcon(pin: PickPin) {
  const meta = categoryMeta(pin.category);
  return L.divIcon({
    className: '',
    html: `<span class="pick-pin${pin.shared ? ' pick-pin--shared' : ''}" style="background:${meta.color}">${pin.rank}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 26],
    popupAnchor: [0, -24],
  });
}

/** A person's list as a map: ONLY their picks, nothing else. */
export default function PickMap({ pins }: { pins: PickPin[] }) {
  const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number]));

  return (
    <MapContainer
      bounds={bounds.pad(0.2)}
      scrollWheelZoom
      className="h-full w-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {pins.map((pin) => {
        const meta = categoryMeta(pin.category);
        return (
          <Marker key={pin.rank} position={[pin.lat, pin.lng]} icon={pinIcon(pin)}>
            <Popup>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {pin.rank}. {pin.name}
                </p>
                <p className="text-xs text-text-muted">
                  {meta.emoji} {meta.label}
                  {pin.neighborhood ? ` · ${pin.neighborhood}` : ''}
                </p>
                {pin.note && <p className="text-xs italic">“{pin.note}”</p>}
                {pin.shared && (
                  <p className="text-xs font-medium text-accent">On your list too</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
