'use client';

import Link from 'next/link';
import { MapPin, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export type ExplorePlace = {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  coverImage: string | null;
  matchedPostCount: number;
  totalPostCount: number;
  topTags: { slug: string; label: string; emoji: string }[];
};

export function PlaceCard({ place }: { place: ExplorePlace }) {
  return (
    <Link
      href={`/place/${place.id}`}
      className="block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-medium">{place.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
            <MapPin size={12} strokeWidth={1.8} />
            {place.city} · {place.address}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 capitalize">
          {place.category}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
        <Users size={13} strokeWidth={1.8} />
        {place.matchedPostCount > 0 ? (
          <span>
            <span className="font-medium text-text-primary">
              {place.matchedPostCount}
            </span>{' '}
            post{place.matchedPostCount === 1 ? '' : 's'} from people who share your taste
          </span>
        ) : (
          <span>No posts from your taste network yet</span>
        )}
      </div>

      {place.topTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {place.topTags.map((tag) => (
            <span
              key={tag.slug}
              className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent"
            >
              <span aria-hidden>{tag.emoji}</span>
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
