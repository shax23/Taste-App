'use client';

import Link from 'next/link';
import { MapPin, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, tierBadgeVariant } from '@/components/ui/Badge';
import type { Tier } from '@/lib/credibility';

type MatchUser = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  score: number;
  tier: Tier;
  sharedInterests: { slug: string; label: string; emoji: string }[];
};

export function MatchList({ matches }: { matches: MatchUser[] }) {
  if (matches.length === 0) {
    return (
      <div className="flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <Users size={28} className="text-accent" strokeWidth={1.5} />
        <p className="max-w-sm text-sm text-text-muted">
          No taste matches yet. Add more interests to find people who share your sense of discovery.
        </p>
        <Link
          href="/interests"
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Update interests
        </Link>
      </div>
    );
  }

  return (
    <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
      {matches.map((match) => (
        <Link
          key={match.username}
          href={`/profile/${match.username}`}
          className="group flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 transition-shadow hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Avatar src={match.avatarUrl} name={match.displayName} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium group-hover:text-accent transition-colors truncate">
                  {match.displayName}
                </span>
                <Badge variant={tierBadgeVariant(match.tier)}>{match.tier}</Badge>
              </div>
              {match.city && match.city !== 'Barcelona' && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                  <MapPin size={11} strokeWidth={1.8} />
                  {match.city}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-text-muted">overlap</p>
              <p className="text-lg font-semibold text-accent tabular-nums">
                {match.sharedInterests.length}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {match.sharedInterests.map((interest) => (
              <span
                key={interest.slug}
                className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent"
              >
                <span aria-hidden>{interest.emoji}</span>
                {interest.label}
              </span>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}
