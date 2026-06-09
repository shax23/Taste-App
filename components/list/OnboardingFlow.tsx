'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PICK_CATEGORIES, LIST_SIZE } from '@/lib/taste';
import { INTEREST_TAXONOMY, CATEGORY_LABELS, CATEGORIES } from '@/lib/interests';
import { cn } from '@/lib/utils';

// friendlier section headers for the vibes step
const INTEREST_GROUP_LABELS: Record<string, string> = {
  food: 'Food & Drink',
  movement: 'Sports & Movement',
  culture: 'Arts & Culture',
  lifestyle: 'Lifestyle',
  nightlife: 'Music & Nightlife',
};

const NEIGHBORHOODS = [
  'Gràcia',
  'El Born',
  'El Raval',
  'Barri Gòtic',
  'Eixample',
  'Poble-sec',
  'Barceloneta',
  'Poblenou',
  'Montjuïc',
  'Sant Gervasi',
  'El Carmel',
  'Port Vell',
];

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

type Suggestion = SearchResult & { source: 'local'; placeId: string };

const STEPS = ['intro', 'interests', 'categories', 'neighborhoods', 'build'] as const;
type Step = (typeof STEPS)[number];

function catMeta(slug: string | null) {
  return PICK_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('intro');
  const [dir, setDir] = useState(1);

  // preferences
  const [vibes, setVibes] = useState<Set<string>>(new Set());
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [hoods, setHoods] = useState<Set<string>>(new Set());

  // list
  const [picks, setPicks] = useState<Pick[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  const reload = useCallback(async () => {
    const res = await fetch('/api/picks');
    if (res.ok) setPicks((await res.json()).picks);
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);

  function go(next: Step) {
    setDir(STEPS.indexOf(next) > stepIndex ? 1 : -1);
    setError(null);
    setStep(next);
  }
  function toggle(set: React.Dispatch<React.SetStateAction<Set<string>>>, v: string) {
    set((prev) => {
      const n = new Set(prev);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });
  }

  // persist vibes to the user's interests (best-effort; API needs ≥3)
  function saveVibes() {
    if (vibes.size >= 3) {
      fetch('/api/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: [...vibes] }),
      }).catch(() => {});
    }
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

  return (
    <div className="mx-auto max-w-2xl">
      {/* progress dots */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              i <= stepIndex ? 'bg-accent' : 'bg-surface-2'
            )}
          />
        ))}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {step === 'intro' && <IntroStep onNext={() => go('interests')} />}

            {step === 'interests' && (
              <ChipStep
                eyebrow="Step 1 of 3"
                title="What are you into?"
                subtitle="Sports, music, coffee, art… pick what you love. This colors the places we suggest."
                onBack={() => go('intro')}
                onNext={() => {
                  saveVibes();
                  go('categories');
                }}
                canSkip
              >
                <div className="space-y-6">
                  {CATEGORIES.map((group) => {
                    const items = INTEREST_TAXONOMY.filter((it) => it.category === group);
                    return (
                      <div key={group}>
                        <p className="mb-2.5 text-xs font-medium uppercase tracking-widest text-text-muted">
                          {INTEREST_GROUP_LABELS[group] ?? CATEGORY_LABELS[group]}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {items.map((it) => {
                            const on = vibes.has(it.slug);
                            return (
                              <button
                                key={it.slug}
                                onClick={() => toggle(setVibes, it.slug)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all',
                                  on
                                    ? 'border-accent bg-accent text-white shadow-sm'
                                    : 'border-line bg-surface hover:border-accent/50'
                                )}
                              >
                                <span aria-hidden>{it.emoji}</span>
                                {it.label}
                                {on && <Check size={13} strokeWidth={2.5} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ChipStep>
            )}

            {step === 'categories' && (
              <ChipStep
                eyebrow="Step 2 of 3"
                title="What kinds of places are you?"
                subtitle="Pick the categories that define your Barcelona. We'll suggest spots to match."
                onBack={() => go('interests')}
                onNext={() => go('neighborhoods')}
                canSkip
              >
                <div className="flex flex-wrap gap-2.5">
                  {PICK_CATEGORIES.map((c) => {
                    const on = cats.has(c.slug);
                    return (
                      <button
                        key={c.slug}
                        onClick={() => toggle(setCats, c.slug)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-all',
                          on
                            ? 'border-transparent text-white shadow-sm'
                            : 'border-line bg-surface hover:border-accent/50'
                        )}
                        style={on ? { background: c.color } : undefined}
                      >
                        <span aria-hidden className="text-base">
                          {c.emoji}
                        </span>
                        {c.label}
                        {on && <Check size={14} strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              </ChipStep>
            )}

            {step === 'neighborhoods' && (
              <ChipStep
                eyebrow="Step 3 of 3"
                title="Where do you spend your time?"
                subtitle="Choose the neighborhoods that feel like yours. Optional — it just sharpens your suggestions."
                onBack={() => go('categories')}
                onNext={() => go('build')}
                canSkip
              >
                <div className="flex flex-wrap gap-2.5">
                  {NEIGHBORHOODS.map((n) => {
                    const on = hoods.has(n);
                    return (
                      <button
                        key={n}
                        onClick={() => toggle(setHoods, n)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm transition-all',
                          on
                            ? 'border-accent bg-accent text-white shadow-sm'
                            : 'border-line bg-surface hover:border-accent/50'
                        )}
                      >
                        <MapPin size={13} strokeWidth={1.8} />
                        {n}
                        {on && <Check size={14} strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>
              </ChipStep>
            )}

            {step === 'build' && (
              <BuildStep
                vibes={vibes}
                cats={cats}
                hoods={hoods}
                picks={picks}
                reload={reload}
                error={error}
                setError={setError}
                onBack={() => go('neighborhoods')}
                onPublish={publish}
                publishing={publishing}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- intro */

function IntroStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-light">
        <Sparkles className="text-accent" size={28} />
      </div>
      <h1 className="mt-6 font-display text-3xl italic leading-snug md:text-4xl">
        Build your Barcelona{' '}
        <span className="not-italic text-accent">in {LIST_SIZE} places.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-text-muted">
        Taste runs on reciprocity — publish the {LIST_SIZE} places you actually
        stand behind, and you unlock everyone else's lists. No followers, no
        feeds. We'll ask a couple of quick questions, then help you fill it.
      </p>
      <Button onClick={onNext} size="lg" className="mt-8">
        Get started <ArrowRight size={16} className="ml-1.5" />
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------- chip step */

function ChipStep({
  eyebrow,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  canSkip,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  canSkip?: boolean;
}) {
  return (
    <div className="py-2">
      <p className="text-xs font-medium uppercase tracking-widest text-accent">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl italic md:text-3xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">{subtitle}</p>
      <div className="mt-7">{children}</div>
      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <Button onClick={onNext} size="lg">
          {canSkip ? 'Continue' : 'Next'} <ArrowRight size={16} className="ml-1.5" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- build step */

function BuildStep({
  vibes,
  cats,
  hoods,
  picks,
  reload,
  error,
  setError,
  onBack,
  onPublish,
  publishing,
}: {
  vibes: Set<string>;
  cats: Set<string>;
  hoods: Set<string>;
  picks: Pick[];
  reload: () => Promise<void>;
  error: string | null;
  setError: (s: string | null) => void;
  onBack: () => void;
  onPublish: () => void;
  publishing: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [pendingOsm, setPendingOsm] = useState<SearchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const onList = useMemo(() => new Set(picks.map((p) => p.place.id)), [picks]);
  const complete = picks.length >= LIST_SIZE;
  const full = picks.length >= LIST_SIZE;

  // load preference-driven suggestions once
  useEffect(() => {
    const params = new URLSearchParams();
    if (vibes.size) params.set('interests', [...vibes].join(','));
    if (cats.size) params.set('categories', [...cats].join(','));
    if (hoods.size) params.set('neighborhoods', [...hoods].join(','));
    fetch(`/api/places/suggestions?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setSuggestions(d.results ?? []))
      .catch(() => setSuggestions([]));
  }, [vibes, cats, hoods]);

  // debounced search
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
        setResults((await res.json()).results ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function add(result: SearchResult, category?: string) {
    setError(null);
    if (full) {
      setError(`Your list is full at ${LIST_SIZE}. Remove one to swap.`);
      return;
    }
    if (result.source === 'osm' && !category && !result.category) {
      setPendingOsm(result);
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

  const visibleSuggestions = suggestions.filter((s) => !onList.has(s.placeId)).slice(0, 8);

  return (
    <div className="py-2">
      <p className="text-xs font-medium uppercase tracking-widest text-accent">Step 3 of 3</p>
      <h2 className="mt-2 font-display text-2xl italic md:text-3xl">
        Fill your list.
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">
        Add the {LIST_SIZE} places you love — from our picks for you, or search anything in
        Barcelona.
      </p>

      {/* progress */}
      <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {picks.length} of {LIST_SIZE} added
          </span>
          {complete ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-score-high">
              <Sparkles size={14} /> Ready to publish
            </span>
          ) : (
            <span className="text-text-muted">{LIST_SIZE - picks.length} to go</span>
          )}
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full rounded-full bg-accent"
            animate={{ width: `${(picks.length / LIST_SIZE) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* search */}
      {!full && (
        <div className="relative mt-5">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any Barcelona spot…"
            className="w-full rounded-full border border-line bg-surface py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-text-muted focus:border-accent"
          />
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
                          {already ? 'Added' : meta?.label ?? 'Pick category'}
                        </span>
                      </button>
                    );
                  })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* OSM category prompt */}
      <AnimatePresence>
        {pendingOsm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 rounded-2xl border border-accent/30 bg-accent-light/40 p-4"
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

      {error && <p className="mt-4 text-sm text-accent">{error}</p>}

      {/* suggestions */}
      {!full && visibleSuggestions.length > 0 && (
        <div className="mt-6">
          <p className="mb-2.5 text-sm font-medium">
            {vibes.size || cats.size || hoods.size ? 'Picked for you' : 'Popular in Barcelona'}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleSuggestions.map((s) => {
              const meta = catMeta(s.category);
              return (
                <button
                  key={s.placeId}
                  onClick={() => add(s)}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-accent/50"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                    style={{ background: `${meta?.color ?? '#999'}1A` }}
                  >
                    {meta?.emoji ?? '📍'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{s.name}</span>
                    <span className="block truncate text-xs text-text-muted">
                      {[s.neighborhood, meta?.label].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <Plus
                    size={16}
                    className="shrink-0 text-text-muted transition-colors group-hover:text-accent"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* current list */}
      {picks.length > 0 && (
        <ol className="mt-6 space-y-2.5">
          <AnimatePresence initial={false}>
            {picks.map((pick, i) => {
              const meta = catMeta(pick.place.category);
              return (
                <motion.li
                  key={pick.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="rounded-2xl border border-line bg-surface p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 shrink-0 text-center font-display text-base italic text-text-muted">
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

      {/* footer */}
      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <Button onClick={onPublish} size="lg" disabled={!complete || publishing}>
          {publishing
            ? 'Publishing…'
            : complete
              ? 'Publish — unlock Barcelona'
              : `Add ${LIST_SIZE - picks.length} more`}
        </Button>
      </div>
    </div>
  );
}
