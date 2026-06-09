'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, ChevronUp, ChevronDown, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PICK_CATEGORIES, LIST_SIZE } from '@/lib/taste';
import { cn } from '@/lib/utils';

type Pick = {
  id: string;
  note: string | null;
  rank: number;
  place: {
    id: string;
    name: string;
    category: string;
    address: string;
    neighborhood: string | null;
    lat: number;
    lng: number;
  };
};

type SearchResult = {
  source: 'local' | 'osm';
  placeId?: string;
  externalId?: string;
  name: string;
  category: string | null;
  address: string;
  neighborhood: string | null;
  lat: number;
  lng: number;
};

function catMeta(slug: string | null) {
  return PICK_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function ListBuilder({ published }: { published: boolean }) {
  const router = useRouter();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingOsm, setPendingOsm] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const reload = useCallback(async () => {
    const res = await fetch('/api/picks');
    if (res.ok) {
      const data = await res.json();
      setPicks(data.picks);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // debounced places lookup
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const onList = new Set(picks.map((p) => p.place.id));

  async function add(result: SearchResult, category?: string) {
    setError(null);
    if (result.source === 'osm' && !category && !result.category) {
      setPendingOsm(result); // needs one of the six categories first
      return;
    }
    const body =
      result.source === 'local'
        ? { placeId: result.placeId }
        : {
            place: {
              name: result.name,
              lat: result.lat,
              lng: result.lng,
              address: result.address,
              neighborhood: result.neighborhood,
              externalId: result.externalId,
            },
            category: category ?? result.category,
          };
    const res = await fetch('/api/picks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Could not add that place.');
      return;
    }
    setPendingOsm(null);
    setQuery('');
    setResults([]);
    reload();
  }

  async function remove(pickId: string) {
    setError(null);
    await fetch(`/api/picks?id=${pickId}`, { method: 'DELETE' });
    reload();
  }

  async function move(pickId: string, dir: 'up' | 'down') {
    await fetch('/api/picks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickId, move: dir }),
    });
    reload();
  }

  async function saveNote(pickId: string, note: string) {
    await fetch('/api/picks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickId, note }),
    });
  }

  async function publish() {
    setPublishing(true);
    setError(null);
    const res = await fetch('/api/list/publish', { method: 'POST' });
    const data = await res.json();
    setPublishing(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not publish.');
      return;
    }
    router.push('/');
    router.refresh();
  }

  const complete = picks.length >= LIST_SIZE;

  return (
    <div className="space-y-8">
      {/* progress */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {picks.length} of {LIST_SIZE} added
          </p>
          {!published &&
            (complete ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-score-high">
                <Sparkles size={14} /> Ready to publish
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                <Lock size={13} /> Barcelona unlocks at {LIST_SIZE}
              </span>
            ))}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full rounded-full bg-accent"
            animate={{ width: `${(picks.length / LIST_SIZE) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        {!published && (
          <Button
            onClick={publish}
            size="lg"
            className="mt-4 w-full"
            disabled={!complete || publishing}
          >
            {publishing
              ? 'Publishing…'
              : complete
                ? 'Publish my list — unlock Barcelona'
                : `Add ${LIST_SIZE - picks.length} more to publish`}
          </Button>
        )}
        {published && (
          <p className="mt-3 text-xs text-text-muted">
            Your list is live — edits save instantly.
          </p>
        )}
      </div>

      {/* search */}
      {picks.length < LIST_SIZE && (
        <div className="relative">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a Barcelona spot — cafe, bar, shop, neighborhood…"
              className="w-full rounded-full border border-line bg-surface py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-accent"
            />
          </div>

          <AnimatePresence>
            {(results.length > 0 || searching) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute inset-x-0 top-14 z-30 overflow-hidden rounded-2xl border border-line bg-surface shadow-md"
              >
                {searching && (
                  <p className="px-4 py-3 text-sm text-text-muted">Searching Barcelona…</p>
                )}
                {!searching &&
                  results.map((r, i) => {
                    const meta = catMeta(r.category);
                    const already = r.placeId ? onList.has(r.placeId) : false;
                    return (
                      <button
                        key={`${r.source}-${r.placeId ?? r.externalId ?? i}`}
                        onClick={() => !already && add(r)}
                        disabled={already}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                          already ? 'opacity-40' : 'hover:bg-surface-2'
                        )}
                      >
                        <span aria-hidden className="text-base">
                          {meta?.emoji ?? '📍'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{r.name}</span>
                          <span className="block truncate text-xs text-text-muted">
                            {[r.neighborhood, r.address].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-text-muted">
                          {already ? 'On your list' : meta?.label ?? 'Pick category'}
                        </span>
                      </button>
                    );
                  })}
                {!searching && results.length === 0 && query.trim().length >= 2 && (
                  <p className="px-4 py-3 text-sm text-text-muted">
                    Nothing found — try the place's full name.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* OSM result needs a category */}
      <AnimatePresence>
        {pendingOsm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-2xl border border-accent/30 bg-accent-light/40 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm">
                What kind of place is{' '}
                <span className="font-medium">{pendingOsm.name}</span>?
              </p>
              <button
                onClick={() => setPendingOsm(null)}
                className="text-text-muted hover:text-text-primary"
                aria-label="Cancel"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {PICK_CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => add(pendingOsm, c.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
                >
                  <span aria-hidden>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-sm text-accent">{error}</p>}

      {/* the list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : picks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <MapPin size={22} className="mx-auto text-text-muted" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-text-muted">
            Your list is empty. Add the {LIST_SIZE} Barcelona places you actually love.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          <AnimatePresence initial={false}>
            {picks.map((pick, i) => {
              const meta = catMeta(pick.place.category);
              return (
                <motion.li
                  key={pick.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="rounded-2xl border border-line bg-surface p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 w-6 shrink-0 text-center font-display text-lg italic text-text-muted">
                      {pick.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{pick.place.name}</p>
                        {meta && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ background: `${meta.color}1A`, color: meta.color }}
                          >
                            <span aria-hidden>{meta.emoji}</span>
                            {meta.label}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-text-muted">
                        {[pick.place.neighborhood, pick.place.address]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <input
                        defaultValue={pick.note ?? ''}
                        onBlur={(e) => saveNote(pick.id, e.target.value)}
                        placeholder="Why do you love it? (one line)"
                        maxLength={140}
                        className="mt-2 w-full rounded-lg border border-transparent bg-surface-2 px-3 py-1.5 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-line"
                      />
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <button
                        onClick={() => move(pick.id, 'up')}
                        disabled={i === 0}
                        className="rounded p-1 text-text-muted transition-colors hover:text-text-primary disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        onClick={() => remove(pick.id)}
                        className="rounded p-1 text-text-muted transition-colors hover:text-accent"
                        aria-label="Remove"
                      >
                        <X size={15} />
                      </button>
                      <button
                        onClick={() => move(pick.id, 'down')}
                        disabled={i === picks.length - 1}
                        className="rounded p-1 text-text-muted transition-colors hover:text-text-primary disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}
    </div>
  );
}
