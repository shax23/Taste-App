import { PICK_CATEGORIES, toPickCategory } from '@/lib/taste';

export type TasteSummaryData = {
  interests: { slug: string; label: string; emoji: string }[];
  categoryCounts: Record<string, number>; // pick-category slug → count
  neighborhoods: { name: string; count: number }[];
  totalPicks: number;
};

/** A person's taste at a glance: vibes + how their list breaks down. */
export function TasteSummary({ data, title = 'Taste' }: { data: TasteSummaryData; title?: string }) {
  const { interests, categoryCounts, neighborhoods, totalPicks } = data;
  const maxCat = Math.max(1, ...Object.values(categoryCounts));
  const activeCategories = PICK_CATEGORIES.filter((c) => (categoryCounts[c.slug] ?? 0) > 0);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
      <h2 className="font-display text-xl italic">
        {title}<span className="not-italic text-accent">.</span>
      </h2>

      {interests.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Into
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {interests.map((it) => (
              <span
                key={it.slug}
                className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-1 text-xs font-medium text-accent"
              >
                <span aria-hidden>{it.emoji}</span>
                {it.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
          List by category
        </p>
        <div className="mt-3 space-y-2.5">
          {activeCategories.map((c) => {
            const n = categoryCounts[c.slug] ?? 0;
            return (
              <div key={c.slug} className="flex items-center gap-3">
                <span className="flex w-28 shrink-0 items-center gap-1.5 text-sm">
                  <span aria-hidden>{c.emoji}</span>
                  <span className="truncate">{c.label}</span>
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(n / maxCat) * 100}%`, background: c.color }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right text-sm tabular-nums text-text-muted">
                  {n}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {neighborhoods.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Neighborhoods · {neighborhoods.length}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {neighborhoods.map((n) => (
              <span
                key={n.name}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-text-primary"
              >
                {n.name}
                {n.count > 1 && <span className="text-text-muted">×{n.count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** Build TasteSummary input from a user's picks + interests. */
export function buildTasteSummary(
  picks: { place: { category: string; neighborhood: string | null } }[],
  interests: { slug: string; label: string; emoji: string }[]
): TasteSummaryData {
  const categoryCounts: Record<string, number> = {};
  const hoodMap = new Map<string, number>();
  for (const { place } of picks) {
    const cat = toPickCategory(place.category);
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    if (place.neighborhood) {
      hoodMap.set(place.neighborhood, (hoodMap.get(place.neighborhood) ?? 0) + 1);
    }
  }
  const neighborhoods = [...hoodMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { interests, categoryCounts, neighborhoods, totalPicks: picks.length };
}
