import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { MapPin } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tierForScore } from '@/lib/credibility';
import { Badge } from '@/components/ui/Badge';
import { MiniMap } from '@/components/place/MiniMap';
import { PlacePosts } from '@/components/place/PlacePosts';
import type { FeedPost } from '@/components/feed/FeedCard';

export default async function PlacePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) redirect('/auth/signin');
  const userId = session.user.userId;

  const place = await prisma.place.findUnique({
    where: { id: params.id },
    include: {
      posts: {
        include: {
          user: { include: { credibilityScore: true } },
          interests: { include: { interest: true } },
          validations: { where: { validatorId: userId }, select: { id: true } },
        },
      },
    },
  });
  if (!place) notFound();

  const myInterests = await prisma.userInterest.findMany({
    where: { userId },
    select: { interestId: true },
  });
  const myInterestSet = new Set(myInterests.map((i) => i.interestId));

  // interest tags appearing across all posts from this place
  const tagMap = new Map<string, { label: string; emoji: string; count: number }>();
  for (const post of place.posts) {
    for (const pi of post.interests) {
      const entry = tagMap.get(pi.interest.slug) ?? {
        label: pi.interest.label,
        emoji: pi.interest.emoji,
        count: 0,
      };
      entry.count++;
      tagMap.set(pi.interest.slug, entry);
    }
  }
  const tags = [...tagMap.entries()].sort((a, b) => b[1].count - a[1].count);

  // posts sorted by poster credibility descending
  const posts: FeedPost[] = place.posts
    .map((p) => {
      const score = p.user.credibilityScore?.totalScore ?? 0;
      return {
        id: p.id,
        content: p.content,
        postType: p.postType,
        createdAt: p.createdAt.toISOString(),
        user: {
          username: p.user.username,
          displayName: p.user.displayName,
          avatarUrl: p.user.avatarUrl,
          city: p.user.city,
          score,
          tier: tierForScore(score),
        },
        place: null,
        interests: p.interests.map((pi) => ({
          slug: pi.interest.slug,
          label: pi.interest.label,
          emoji: pi.interest.emoji,
          category: pi.interest.category,
          shared: myInterestSet.has(pi.interestId),
        })),
        alreadyValidated: p.validations.length > 0,
      };
    })
    .sort((a, b) => b.user.score - a.user.score);

  return (
    <div className="py-8 md:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">{place.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-text-muted">
            <MapPin size={14} strokeWidth={1.8} />
            {place.address} · {place.city}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {place.category}
        </Badge>
      </header>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <div className="h-56 overflow-hidden rounded-2xl border border-line">
            <MiniMap lat={place.lat} lng={place.lng} category={place.category} />
          </div>

          {tags.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-sm font-medium">
                Shared by people who like&hellip;
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map(([slug, tag]) => (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent"
                  >
                    <span aria-hidden>{tag.emoji}</span>
                    {tag.label}
                    <span className="text-accent/60">×{tag.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-sm font-medium text-text-muted">
            {posts.length} post{posts.length === 1 ? '' : 's'} from this place
          </h2>
          <PlacePosts posts={posts} />
        </div>
      </div>
    </div>
  );
}
