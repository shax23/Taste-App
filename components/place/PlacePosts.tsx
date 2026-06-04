'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, tierBadgeVariant } from '@/components/ui/Badge';
import { ValidateModal } from '@/components/feed/ValidateModal';
import type { FeedPost } from '@/components/feed/FeedCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { timeAgo, cn } from '@/lib/utils';

export function PlacePosts({ posts: initial }: { posts: FeedPost[] }) {
  const [posts, setPosts] = useState(initial);
  const [validating, setValidating] = useState<FeedPost | null>(null);

  function markValidated(postId: string) {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, alreadyValidated: true } : p))
    );
  }

  if (posts.length === 0) {
    return (
      <EmptyState message="No one in your taste network has posted here yet. Be the first." />
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <article
          key={post.id}
          className="rounded-2xl border border-line bg-surface p-4"
        >
          <div className="flex items-center gap-2.5">
            <Link href={`/profile/${post.user.username}`}>
              <Avatar src={post.user.avatarUrl} name={post.user.displayName} size="sm" />
            </Link>
            <Link
              href={`/profile/${post.user.username}`}
              className="text-sm font-medium hover:text-accent"
            >
              {post.user.displayName}
            </Link>
            <Badge variant={tierBadgeVariant(post.user.tier)}>{post.user.tier}</Badge>
            <span className="ml-auto text-xs text-text-muted">
              {timeAgo(post.createdAt)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed">{post.content}</p>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => !post.alreadyValidated && setValidating(post)}
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
          </div>
        </article>
      ))}
      <ValidateModal
        post={validating}
        onClose={() => setValidating(null)}
        onValidated={markValidated}
      />
    </div>
  );
}
