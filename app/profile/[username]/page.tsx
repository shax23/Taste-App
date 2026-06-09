import { notFound, redirect } from 'next/navigation';
import { Sparkles, Lock } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getViewer } from '@/lib/viewer';
import { computeOverlap, type OverlapInput } from '@/lib/taste';
import { Avatar } from '@/components/ui/Avatar';
import { PicksSection } from '@/components/profile/PicksSection';
import { TasteSummary, buildTasteSummary } from '@/components/profile/TasteSummary';
import type { PickPin } from '@/components/profile/PickMap';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const viewer = await getViewer();
  if (!viewer) redirect('/auth/signin');
  if (viewer.username === params.username) redirect('/profile/me');
  if (!viewer.published) redirect('/onboarding'); // reciprocity gate

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      picks: { include: { place: true }, orderBy: { rank: 'asc' } },
      interests: { include: { interest: true } },
    },
  });
  if (!user) notFound();

  // their list isn't public until they publish either
  if (!user.publishedAt || user.picks.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <Avatar src={user.avatarUrl} name={user.displayName} size="xl" className="mx-auto" />
        <h1 className="mt-5 font-display text-2xl">{user.displayName}</h1>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-text-muted">
          <Lock size={14} /> Hasn't published a list yet.
        </p>
      </div>
    );
  }

  const myPicks = await prisma.pick.findMany({
    where: { userId: viewer.id },
    include: { place: true },
  });

  const mine: OverlapInput[] = myPicks.map((p) => ({
    placeId: p.placeId,
    neighborhood: p.place.neighborhood,
    category: p.place.category,
  }));
  const theirs: OverlapInput[] = user.picks.map((p) => ({
    placeId: p.placeId,
    neighborhood: p.place.neighborhood,
    category: p.place.category,
  }));
  const overlap = computeOverlap(mine, theirs);

  const pins: PickPin[] = user.picks.map((p) => ({
    rank: p.rank,
    name: p.place.name,
    note: p.note,
    category: p.place.category,
    neighborhood: p.place.neighborhood,
    lat: p.place.lat,
    lng: p.place.lng,
    shared: overlap.sharedPlaceIds.has(p.placeId),
  }));

  return (
    <div className="py-8 md:py-12">
      <header className="flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:gap-6 md:text-left">
        <Avatar src={user.avatarUrl} name={user.displayName} size="xl" />
        <div className="flex-1">
          <div className="flex flex-col items-center gap-2 md:flex-row md:items-baseline md:gap-3">
            <h1 className="font-display text-3xl">{user.displayName}</h1>
            <span className="text-sm text-text-muted">@{user.username}</span>
            {user.isTastemaker && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent">
                <Sparkles size={11} /> Tastemaker
              </span>
            )}
          </div>
          {user.bio && (
            <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">{user.bio}</p>
          )}
        </div>

        {/* match score */}
        <div className="rounded-2xl border border-line bg-surface px-6 py-4 text-center">
          <p className="font-display text-3xl text-accent">{overlap.percent}%</p>
          <p className="mt-0.5 text-xs text-text-muted">taste match</p>
          <p className="mt-1 text-xs font-medium">
            {overlap.sharedPlaceCount}{' '}
            {overlap.sharedPlaceCount === 1 ? 'place' : 'places'} in common
          </p>
          {overlap.sharedNeighborhoods.length > 0 && (
            <p className="mt-0.5 text-[11px] text-text-muted">
              + {overlap.sharedNeighborhoods.length} shared{' '}
              {overlap.sharedNeighborhoods.length === 1 ? 'neighborhood' : 'neighborhoods'}
            </p>
          )}
        </div>
      </header>

      <div className="mt-10">
        <TasteSummary
          data={buildTasteSummary(
            user.picks,
            user.interests.map((ui) => ({
              slug: ui.interest.slug,
              label: ui.interest.label,
              emoji: ui.interest.emoji,
            }))
          )}
          title={`${user.displayName.split(' ')[0]}'s taste`}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-xl italic">
          {user.displayName.split(' ')[0]}'s Barcelona
          <span className="not-italic text-accent">.</span>
        </h2>
        <PicksSection pins={pins} ownerName={user.displayName} />
      </section>
    </div>
  );
}
