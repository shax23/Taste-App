import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { MapPin, Sparkles } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tierForScore } from '@/lib/credibility';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, tierBadgeVariant } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/profile/CredibilityScore';
import { timeAgo } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function EzgiPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) redirect('/auth/signin');

  const ezgi = await prisma.user.findUnique({
    where: { username: 'ezgi' },
    include: {
      credibilityScore: true,
      interests: { include: { interest: true } },
      posts: {
        include: { place: true, interests: { include: { interest: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return (
    <div className="py-8 md:py-12">
      <section className="mb-10 max-w-2xl">
        <h1 className="font-display text-3xl italic leading-snug md:text-4xl">
          Ezgi&rsquo;s <span className="not-italic text-accent">corner.</span>
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          The places, finds, and moments curated by Ezgi herself.
        </p>
      </section>

      {!ezgi ? (
        <div className="flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <Sparkles size={28} className="text-accent" strokeWidth={1.5} />
          <p className="max-w-sm text-sm text-text-muted">
            This space is waiting for{' '}
            <span className="font-medium text-text-primary">@ezgi</span>. Create
            an account with that username and everything posted there will live
            here.
          </p>
          {session.user.username !== 'ezgi' && (
            <Link
              href="/auth/signup"
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Claim @ezgi
            </Link>
          )}
        </div>
      ) : (
        <>
          <header className="flex flex-wrap items-center gap-5 rounded-2xl border border-line bg-surface p-5">
            <Link href={`/profile/${ezgi.username}`}>
              <Avatar src={ezgi.avatarUrl} name={ezgi.displayName} size="lg" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/profile/${ezgi.username}`}
                  className="font-display text-xl hover:text-accent"
                >
                  {ezgi.displayName}
                </Link>
                <Badge
                  variant={tierBadgeVariant(
                    tierForScore(ezgi.credibilityScore?.totalScore ?? 0)
                  )}
                >
                  {tierForScore(ezgi.credibilityScore?.totalScore ?? 0)}
                </Badge>
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                <MapPin size={12} strokeWidth={1.8} />
                {ezgi.city}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ezgi.interests.slice(0, 5).map((ui) => (
                  <span
                    key={ui.interestId}
                    className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent"
                  >
                    <span aria-hidden>{ui.interest.emoji}</span>
                    {ui.interest.label}
                  </span>
                ))}
              </div>
            </div>
            <ScoreRing score={ezgi.credibilityScore?.totalScore ?? 0} size={56} />
          </header>

          {ezgi.posts.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
              <p className="text-sm text-text-muted">
                Nothing posted yet — Ezgi&rsquo;s first find is coming.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid max-w-4xl gap-4 sm:grid-cols-2">
              {ezgi.posts.map((post) => (
                <article
                  key={post.id}
                  className="flex flex-col rounded-2xl border border-line bg-surface p-5"
                >
                  <p className="flex-1 text-[15px] leading-relaxed">{post.content}</p>
                  {post.place && (
                    <Link
                      href={`/place/${post.place.id}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent"
                    >
                      <MapPin size={13} strokeWidth={1.8} />
                      <span className="font-medium text-text-primary">
                        {post.place.name}
                      </span>
                    </Link>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {post.interests.map((pi) => (
                        <span
                          key={pi.interestId}
                          className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-text-muted"
                        >
                          {pi.interest.emoji} {pi.interest.label}
                        </span>
                      ))}
                    </div>
                    <span className="shrink-0 text-xs text-text-muted">
                      {timeAgo(post.createdAt)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
