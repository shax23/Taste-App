'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, tierBadgeVariant } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/profile/CredibilityScore';

export type PopularProfile = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string;
  score: number;
  tier: string;
};

export function PopularProfiles({ profiles }: { profiles: PopularProfile[] }) {
  if (profiles.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl italic">
          Popular <span className="not-italic text-accent">tastemakers</span>
        </h2>
        <span className="text-xs text-text-muted">ranked by credibility</span>
      </div>

      <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {profiles.map((p, i) => (
          <motion.div
            key={p.username}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07, ease: 'easeOut' }}
            className="snap-start"
          >
            <Link
              href={`/profile/${p.username}`}
              className="group flex h-full w-44 shrink-0 flex-col items-center rounded-2xl border border-line bg-surface p-4 text-center transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
            >
              <div className="relative">
                <Avatar
                  src={p.avatarUrl}
                  name={p.displayName}
                  size="lg"
                  className="ring-2 ring-accent-light ring-offset-2 ring-offset-surface transition group-hover:ring-accent/50"
                />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-surface p-0.5">
                  <ScoreRing score={p.score} size={26} showNumber={false} />
                </span>
              </div>

              <p className="mt-3 w-full truncate text-sm font-medium group-hover:text-accent">
                {p.displayName}
              </p>
              <Badge variant={tierBadgeVariant(p.tier)} className="mt-1.5">
                {p.tier}
              </Badge>

              {p.bio && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-muted">
                  {p.bio}
                </p>
              )}

              <p className="mt-auto flex items-center gap-1 pt-2 text-[11px] text-text-muted">
                <MapPin size={11} strokeWidth={1.8} />
                {p.city}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
