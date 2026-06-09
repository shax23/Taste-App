import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Pencil, Sparkles } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getViewer } from '@/lib/viewer';
import { Avatar } from '@/components/ui/Avatar';
import { PicksSection } from '@/components/profile/PicksSection';
import { TasteSummary, buildTasteSummary } from '@/components/profile/TasteSummary';
import type { PickPin } from '@/components/profile/PickMap';

export const dynamic = 'force-dynamic';

export default async function MyProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect('/auth/signin');
  if (!viewer.published) redirect('/onboarding');

  const me = await prisma.user.findUniqueOrThrow({
    where: { id: viewer.id },
    include: {
      picks: { include: { place: true }, orderBy: { rank: 'asc' } },
      interests: { include: { interest: true } },
    },
  });

  const interests = me.interests.map((ui) => ({
    slug: ui.interest.slug,
    label: ui.interest.label,
    emoji: ui.interest.emoji,
  }));
  const taste = buildTasteSummary(me.picks, interests);

  const pins: PickPin[] = me.picks.map((p) => ({
    rank: p.rank,
    name: p.place.name,
    note: p.note,
    category: p.place.category,
    neighborhood: p.place.neighborhood,
    lat: p.place.lat,
    lng: p.place.lng,
    shared: false,
  }));

  return (
    <div className="py-8 md:py-12">
      <header className="flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:gap-6 md:text-left">
        <Avatar src={me.avatarUrl} name={me.displayName} size="xl" />
        <div className="flex-1">
          <div className="flex flex-col items-center gap-2 md:flex-row md:items-baseline md:gap-3">
            <h1 className="font-display text-3xl">{me.displayName}</h1>
            <span className="text-sm text-text-muted">@{me.username}</span>
            {me.isTastemaker && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent">
                <Sparkles size={11} /> Tastemaker
              </span>
            )}
          </div>
          {me.bio && (
            <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">{me.bio}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
          >
            <Pencil size={14} /> Edit my list
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs text-text-muted transition-colors hover:text-accent"
          >
            Edit my taste
          </Link>
        </div>
      </header>

      <div className="mt-10">
        <TasteSummary data={taste} title="My taste" />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-xl italic">
          My Barcelona<span className="not-italic text-accent">.</span>
        </h2>
        <PicksSection pins={pins} ownerName={me.displayName} />
      </section>
    </div>
  );
}
