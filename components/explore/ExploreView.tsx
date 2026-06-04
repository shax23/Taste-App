'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapIcon, List } from 'lucide-react';
import { PlaceCard, type ExplorePlace } from './PlaceCard';
import { PlaceCardSkeleton } from '@/components/ui/Skeletons';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { cn, CITY_COORDS } from '@/lib/utils';

const PlaceMap = dynamic(() => import('./PlaceMap'), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-2xl" />,
});

const CATEGORIES = [
  'all',
  'cafe',
  'restaurant',
  'bar',
  'park',
  'studio',
  'gallery',
  'market',
  'bookshop',
  'club',
];

export function ExploreView({ userCity }: { userCity: string }) {
  const [places, setPlaces] = useState<ExplorePlace[]>([]);
  const [category, setCategory] = useState('all');
  const [city, setCity] = useState<string>(CITY_COORDS[userCity] ? userCity : 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/places?city=${encodeURIComponent(city)}&category=${category}`);
      if (!res.ok) throw new Error('places failed');
      const data = await res.json();
      setPlaces(data.places);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [city, category]);

  useEffect(() => {
    load();
  }, [load]);

  const center = useMemo(() => {
    if (CITY_COORDS[city]) return CITY_COORDS[city];
    if (places.length > 0) return { lat: places[0].lat, lng: places[0].lng };
    return CITY_COORDS[userCity] ?? { lat: 41.3874, lng: 2.1686 };
  }, [city, places, userCity]);

  const cities = ['all', ...Object.keys(CITY_COORDS)];

  const filters = (
    <div className="flex flex-wrap gap-2">
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="h-9 rounded-full border border-line bg-surface px-3 text-sm text-text-primary focus:border-accent focus:outline-none"
        aria-label="City"
      >
        {cities.map((c) => (
          <option key={c} value={c}>
            {c === 'all' ? 'All cities' : c}
          </option>
        ))}
      </select>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-sm capitalize transition-colors',
              category === c
                ? 'bg-text-primary text-white'
                : 'border border-line text-text-muted hover:bg-surface-2'
            )}
          >
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>
    </div>
  );

  const list = loading ? (
    <div className="space-y-3">
      <PlaceCardSkeleton />
      <PlaceCardSkeleton />
      <PlaceCardSkeleton />
    </div>
  ) : error ? (
    <ErrorState message="Couldn't load places." onRetry={load} />
  ) : places.length === 0 ? (
    <EmptyState message="No places match these filters yet. Try widening your search." />
  ) : (
    <div className="space-y-3">
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} />
      ))}
    </div>
  );

  return (
    <div className="py-6 md:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl italic">Explore</h1>
          <p className="mt-1 text-sm text-text-muted">
            Places your taste network actually goes.
          </p>
        </div>
        {/* mobile toggle */}
        <div className="flex gap-1 rounded-full border border-line p-1 md:hidden">
          {(['list', 'map'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm capitalize',
                mobileTab === tab ? 'bg-text-primary text-white' : 'text-text-muted'
              )}
            >
              {tab === 'list' ? <List size={14} /> : <MapIcon size={14} />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">{filters}</div>

      {/* desktop: split panel — map left, cards right */}
      <div className="hidden gap-6 md:grid md:grid-cols-[1.2fr_1fr]">
        <div className="sticky top-24 h-[calc(100vh-180px)] overflow-hidden rounded-2xl border border-line">
          <PlaceMap places={places} center={center} zoom={CITY_COORDS[city] ? 12 : 3} />
        </div>
        <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-1">{list}</div>
      </div>

      {/* mobile: toggled */}
      <div className="md:hidden">
        {mobileTab === 'list' ? (
          list
        ) : (
          <div className="h-[60vh] overflow-hidden rounded-2xl border border-line">
            <PlaceMap places={places} center={center} zoom={CITY_COORDS[city] ? 12 : 3} />
          </div>
        )}
      </div>
    </div>
  );
}
