'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORIES } from '@/lib/interests';
import { ErrorState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

type Interest = { slug: string; label: string; category: string; emoji: string };

const MIN_REQUIRED = 3;

export default function InterestsPage() {
  const router = useRouter();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/interests');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInterests(data.interests);
      setSelected(new Set(data.selected));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const res = await fetch('/api/interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: [...selected] }),
    });
    setSaving(false);
    if (res.ok) {
      router.push('/');
      router.refresh();
    }
  }

  if (error) return <ErrorState message="Couldn't load interests." onRetry={load} />;

  return (
    <div className="min-h-screen pb-32 pt-10 md:pt-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl italic md:text-4xl">
          What do you <span className="not-italic text-accent">actually</span> love doing?
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          Pick at least {MIN_REQUIRED}. This is how we find your people — no
          followers, no friend requests, just shared taste.
        </p>

        {loading ? (
          <div className="mt-10 flex flex-wrap gap-2">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="skeleton h-9 w-32 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {CATEGORIES.map((category) => {
              const group = interests.filter((i) => i.category === category);
              if (group.length === 0) return null;
              return (
                <section key={category}>
                  <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">
                    {CATEGORY_LABELS[category]}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {group.map((interest) => {
                      const isSelected = selected.has(interest.slug);
                      return (
                        <motion.button
                          key={interest.slug}
                          onClick={() => toggle(interest.slug)}
                          whileTap={{ scale: 1.05 }}
                          animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 0.25 }}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors',
                            isSelected
                              ? 'border-accent bg-accent text-white'
                              : 'border-line bg-surface text-text-primary hover:border-accent/50'
                          )}
                        >
                          <span aria-hidden>{interest.emoji}</span>
                          {interest.label}
                          {isSelected && <Check size={14} strokeWidth={2.5} />}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-2xl items-center justify-between px-4 sm:px-6">
          <span className="text-sm text-text-muted">
            <span className="font-medium tabular-nums text-text-primary">
              {selected.size}
            </span>{' '}
            selected
            {selected.size < MIN_REQUIRED && (
              <span> · pick {MIN_REQUIRED - selected.size} more</span>
            )}
          </span>
          <button
            onClick={save}
            disabled={selected.size < MIN_REQUIRED || saving}
            className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Start Discovering'}
          </button>
        </div>
      </div>
    </div>
  );
}
