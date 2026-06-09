import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { MapPin, Check } from 'lucide-react';
import { getViewer } from '@/lib/viewer';
import { prisma } from '@/lib/prisma';
import { categoryMeta } from '@/lib/taste';
import { Avatar } from '@/components/ui/Avatar';
import { MiniMap } from '@/components/place/MiniMap';

export const dynamic = 'force-dynamic';

export default async function PlacePage({ params }: { params: { id: string } }) {
  const viewer = await getViewer();
  if (!viewer) redirect('/auth/signin');
  if (!viewer.published) redirect('/onboarding'); // reciprocity gate

  const place = await prisma.place.findUnique({
    where: { id: params.id },
    include: {
      picks: {
        where: { user: { publishedAt: { not: null } } },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!place) notFound();

  const meta = categoryMeta(place.category);
  const onMyList = place.picks.some((p) => p.userId === viewer.id);

  return (
    <div className="py-8 md:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">{place.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-text-muted">
            <MapPin size={14} strokeWidth={1.8} />
            {[place.neighborhood, place.address].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onMyList && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-1 text-xs font-medium text-accent">
              <Check size={11} /> On your list
            </span>
          )}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: `${meta.color}1A`, color: meta.color }}
          >
            <span aria-hidden>{meta.emoji}</span>
            {meta.label}
          </span>
        </div>
      </header>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <div className="h-56 overflow-hidden rounded-2xl border border-line md:h-72">
          <MiniMap lat={place.lat} lng={place.lng} category={place.category} />
        </div>

        <div>
          <h2 className="mb-4 text-sm font-medium text-text-muted">
            On {place.picks.length} {place.picks.length === 1 ? 'list' : 'lists'}
          </h2>
          {place.picks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-text-muted">
              No published list features this place yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {place.picks.map((pick) => (
                <li key={pick.id}>
                  <Link
                    href={
                      pick.userId === viewer.id
                        ? '/profile/me'
                        : `/profile/${pick.user.username}`
                    }
                    className="group flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-accent/40"
                  >
                    <Avatar
                      src={pick.user.avatarUrl}
                      name={pick.user.displayName}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium group-hover:text-accent">
                        {pick.user.displayName}
                        <span className="ml-2 text-xs font-normal text-text-muted">
                          #{pick.rank} on their list
                        </span>
                      </p>
                      {pick.note && (
                        <p className="mt-1 text-sm italic leading-relaxed text-text-muted">
                          “{pick.note}”
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
