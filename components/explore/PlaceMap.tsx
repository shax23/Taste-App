'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import { PLACE_CATEGORY_COLORS } from '@/lib/interests';
import type { ExplorePlace } from './PlaceCard';

function pinIcon(category: string) {
  const color = PLACE_CATEGORY_COLORS[category] ?? '#7A7269';
  return L.divIcon({
    className: '',
    html: `<span class="taste-pin" style="background:${color}"></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 24],
    popupAnchor: [0, -22],
  });
}

const clusterIcon = (cluster: any) =>
  L.divIcon({
    className: '',
    html: `<span class="taste-cluster">${cluster.getChildCount()}</span>`,
    iconSize: [36, 36],
  });

export default function PlaceMap({
  places,
  center,
  zoom = 12,
}: {
  places: ExplorePlace[];
  center: { lat: number; lng: number };
  zoom?: number;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom
      className="h-full w-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <MarkerClusterGroup chunkedLoading iconCreateFunction={clusterIcon}>
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={pinIcon(place.category)}
          >
            <Popup>
              <div className="space-y-1">
                <p className="text-sm font-medium">{place.name}</p>
                <p className="text-xs capitalize text-text-muted">{place.category}</p>
                <Link
                  href={`/place/${place.id}`}
                  className="text-xs font-medium text-accent underline-offset-2 hover:underline"
                >
                  View Details
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
