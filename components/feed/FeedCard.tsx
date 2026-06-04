'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Check } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, tierBadgeVariant } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/profile/CredibilityScore';
import { timeAgo, cn } from '@/lib/utils';

export type FeedPost = {
  id: string;
  content: string;
  postType: string;
  createdAt: string;
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    city: string;
    score: number;
    tier: string;
  };
  place: { id: string; name: string; category: string; city: string } | null;
  interests: {
    slug: string;
    label: string;
    emoji: string;
    category: string;
    shared: boolean;
  }[];
  alreadyValidated: boolean;
};

export function FeedCard({
  post,
  index = 0,
  onValidate,
}: {
  post: FeedPost;
  index?: number;
  onValidate: (post: FeedPost) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.08, ease: 'easeOut' }}
      className="rounded-2xl border border-line bg-surface p-5"
    >
      <header className="flex items-center gap-3">
        <Link href={`/profile/${post.user.username}`} className="shrink-0">
          <Avatar src={post.user.avatarUrl} name={post.user.displayName} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/profile/${post.user.username}`}
              className="truncate text-sm font-medium hover:text-accent"
            >
              {post.user.displayName}
            </Link>
            <Badge variant={tierBadgeVariant(post.user.tier)}>{post.user.tier}</Badge>
          </div>
          <p className="text-xs text-text-muted">
            {post.user.city} · {timeAgo(post.createdAt)}
          </p>
        </div>
        <ScoreRing score={post.user.score} size={38} />
      </header>

      <p className="mt-4 text-[15px] leading-relaxed">{post.content}</p>

      {post.place && (
        <Link
          href={`/place/${post.place.id}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-accent"
        >
          <MapPin size={14} strokeWidth={1.8} />
          <span className="font-medium text-text-primary">{post.place.name}</span>
          <span>· {post.place.category}</span>
        </Link>
      )}

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {post.interests.map((tag) => (
            <span
              key={tag.slug}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs',
                tag.shared
                  ? 'bg-accent-light font-medium text-accent'
                  : 'bg-surface-2 text-text-muted'
              )}
            >
              <span aria-hidden>{tag.emoji}</span>
              {tag.label}
            </span>
          ))}
        </div>
        <button
          onClick={() => !post.alreadyValidated && onValidate(post)}
          disabled={post.alreadyValidated}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
            post.alreadyValidated
              ? 'cursor-default bg-surface-2 text-score-high'
              : 'border border-line text-text-primary hover:border-accent hover:text-accent'
          )}
        >
          {post.alreadyValidated ? (
            <>
              <Check size={14} /> Tried it
            </>
          ) : (
            'I tried this'
          )}
        </button>
      </footer>
    </motion.article>
  );
}
