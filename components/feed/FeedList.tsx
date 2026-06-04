'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { FeedCard, type FeedPost } from './FeedCard';
import { ValidateModal } from './ValidateModal';
import { FeedCardSkeleton } from '@/components/ui/Skeletons';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { CATEGORY_LABELS } from '@/lib/interests';
import { cn } from '@/lib/utils';

const FILTERS = [
  { key: 'all', label: 'All' },
  ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
];

export function FeedList() {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [validating, setValidating] = useState<FeedPost | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (cat: string, pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/feed?category=${cat}&page=${pageNum}`);
        if (!res.ok) throw new Error('feed failed');
        const data = await res.json();
        if (data.needsOnboarding) {
          router.push('/interests');
          return;
        }
        setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
        setHasMore(data.hasMore);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [router]
  );

  useEffect(() => {
    setPage(1);
    load(category, 1, false);
  }, [category, load]);

  // infinite scroll feel — load next page when the sentinel enters the viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const next = page + 1;
        setPage(next);
        load(category, next, true);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, category, load]);

  function markValidated(postId: string) {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, alreadyValidated: true } : p))
    );
  }

  return (
    <div>
      {/* filter bar */}
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setCategory(f.key)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors',
              category === f.key
                ? 'bg-text-primary text-white'
                : 'border border-line text-text-muted hover:bg-surface-2'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <FeedCardSkeleton />
          <FeedCardSkeleton />
          <FeedCardSkeleton />
        </div>
      ) : error ? (
        <ErrorState
          message="Couldn't load your feed."
          onRetry={() => load(category, 1, false)}
        />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          message="No one in your taste network has posted here yet. Be the first."
        />
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post, i) => (
              <FeedCard key={post.id} post={post} index={i} onValidate={setValidating} />
            ))}
          </div>
          {loadingMore && (
            <div className="mt-4 space-y-4">
              <FeedCardSkeleton />
            </div>
          )}
          <div ref={sentinelRef} className="h-1" />
        </>
      )}

      <ValidateModal
        post={validating}
        onClose={() => setValidating(null)}
        onValidated={markValidated}
      />
    </div>
  );
}
