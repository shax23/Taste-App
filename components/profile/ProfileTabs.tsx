'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { timeAgo, cn } from '@/lib/utils';

export type ProfilePost = {
  id: string;
  content: string;
  postType: string;
  createdAt: string;
  placeName: string | null;
  placeId: string | null;
};

export type ProfilePlace = {
  id: string;
  name: string;
  category: string;
  city: string;
  postCount: number;
};

export function ProfileTabs({
  posts,
  places,
  about,
}: {
  posts: ProfilePost[];
  places: ProfilePlace[];
  about: { bio: string | null; city: string; joined: string };
}) {
  const [tab, setTab] = useState<'posts' | 'places' | 'about'>('posts');

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-line">
        {(['posts', 'places', 'about'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'relative px-4 py-2.5 text-sm capitalize transition-colors',
              tab === t ? 'font-medium text-text-primary' : 'text-text-muted'
            )}
          >
            {t}
            {tab === t && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      {tab === 'posts' &&
        (posts.length === 0 ? (
          <EmptyState icon={FileText} message="No posts yet." />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col rounded-2xl border border-line bg-surface p-4"
              >
                <p className="flex-1 text-sm leading-relaxed line-clamp-4">
                  {post.content}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-text-muted">
                  {post.placeName && post.placeId ? (
                    <Link
                      href={`/place/${post.placeId}`}
                      className="inline-flex min-w-0 items-center gap-1 hover:text-accent"
                    >
                      <MapPin size={11} />
                      <span className="truncate">{post.placeName}</span>
                    </Link>
                  ) : (
                    <span className="capitalize">{post.postType}</span>
                  )}
                  <span className="shrink-0">{timeAgo(post.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === 'places' &&
        (places.length === 0 ? (
          <EmptyState icon={MapPin} message="No places posted from yet." />
        ) : (
          <div className="space-y-2">
            {places.map((place) => (
              <Link
                key={place.id}
                href={`/place/${place.id}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-accent/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{place.name}</p>
                  <p className="text-xs capitalize text-text-muted">
                    {place.category} · {place.city}
                  </p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-text-muted">
                  {place.postCount} post{place.postCount === 1 ? '' : 's'}
                </span>
              </Link>
            ))}
          </div>
        ))}

      {tab === 'about' && (
        <div className="max-w-md space-y-4 text-sm">
          {about.bio && <p className="leading-relaxed">{about.bio}</p>}
          <div className="space-y-1.5 text-text-muted">
            <p>
              <span className="text-text-primary">City:</span> {about.city}
            </p>
            <p>
              <span className="text-text-primary">Joined:</span> {about.joined}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
