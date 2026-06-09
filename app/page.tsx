import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getViewer } from '@/lib/viewer';
import { computeOverlap, type OverlapInput } from '@/lib/taste';
import { PersonCard, type PersonCardData } from '@/components/home/PersonCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const viewer = await getViewer();
  if (!viewer) redirect('/auth/signin');
  if (!viewer.published) redirect('/onboarding'); // reciprocity gate

  const [myPicks, others] = await Promise.all([
    prisma.pick.findMany({
      where: { userId: viewer.id },
      include: { place: true },
    }),
    prisma.user.findMany({
      where: { id: { not: viewer.id }, publishedAt: { not: null } },
      include: { picks: { include: { place: true }, orderBy: { rank: 'asc' } } },
    }),
  ]);

  const mine: OverlapInput[] = myPicks.map((p) => ({
    placeId: p.placeId,
    neighborhood: p.place.neighborhood,
    category: p.place.category,
  }));

  const people: PersonCardData[] = others
    .filter((u) => u.picks.length > 0)
    .map((u) => {
      const theirs: OverlapInput[] = u.picks.map((p) => ({
        placeId: p.placeId,
        neighborhood: p.place.neighborhood,
        category: p.place.category,
      }));
      const overlap = computeOverlap(mine, theirs);
      return {
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        isTastemaker: u.isTastemaker,
        sharedPlaceCount: overlap.sharedPlaceCount,
        percent: overlap.percent,
        sharedPlaceNames: u.picks
          .filter((p) => overlap.sharedPlaceIds.has(p.placeId))
          .map((p) => p.place.name),
        preview: u.picks.slice(0, 3).map((p) => ({
          name: p.place.name,
          category: p.place.category,
        })),
        score: overlap.score,
      };
    })
    .sort((a: any, b: any) => b.score - a.score);

  const tastemakers = people.filter((p) => p.isTastemaker);
  const closest = people.filter((p) => !p.isTastemaker).slice(0, 9);

  return (
    <div className="py-8 md:py-12">
      <section className="mb-10 max-w-2xl">
        <h1 className="font-display text-3xl italic leading-snug md:text-4xl">
          Barcelona, through people{' '}
          <span className="not-italic text-accent">who share your taste.</span>
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          Ranked by overlap with your list — not by followers.
        </p>
      </section>

      {tastemakers.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 font-display text-xl italic">
            Tastemakers<span className="not-italic text-accent">.</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tastemakers.map((p) => (
              <PersonCard key={p.username} person={p} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 font-display text-xl italic">
          Closest to your taste<span className="not-italic text-accent">.</span>
        </h2>
        {closest.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-text-muted">
            No other published lists yet — invite someone whose taste you trust.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closest.map((p) => (
              <PersonCard key={p.username} person={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
