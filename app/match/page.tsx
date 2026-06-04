import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tierForScore } from '@/lib/credibility';
import { MatchList } from '@/components/match/MatchList';

export const dynamic = 'force-dynamic';

export default async function MatchPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) redirect('/auth/signin');

  const myInterests = await prisma.userInterest.findMany({
    where: { userId: session.user.userId },
    select: { interestId: true },
  });

  const myInterestIds = myInterests.map((i) => i.interestId);
  if (myInterestIds.length === 0) redirect('/interests');

  const overlapping = await prisma.userInterest.findMany({
    where: {
      interestId: { in: myInterestIds },
      userId: { not: session.user.userId },
    },
    include: {
      interest: true,
      user: { include: { credibilityScore: true } },
    },
  });

  type Match = {
    user: (typeof overlapping)[0]['user'];
    sharedInterests: (typeof overlapping)[0]['interest'][];
  };

  const matchMap = new Map<string, Match>();
  for (const item of overlapping) {
    if (!matchMap.has(item.userId)) {
      matchMap.set(item.userId, { user: item.user, sharedInterests: [] });
    }
    matchMap.get(item.userId)!.sharedInterests.push(item.interest);
  }

  const matches = [...matchMap.values()]
    .sort((a, b) => {
      const diff = b.sharedInterests.length - a.sharedInterests.length;
      if (diff !== 0) return diff;
      return (b.user.credibilityScore?.totalScore ?? 0) - (a.user.credibilityScore?.totalScore ?? 0);
    })
    .slice(0, 20)
    .map(({ user, sharedInterests }) => ({
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      city: user.city,
      score: user.credibilityScore?.totalScore ?? 0,
      tier: tierForScore(user.credibilityScore?.totalScore ?? 0),
      sharedInterests: sharedInterests.map((i) => ({
        slug: i.slug,
        label: i.label,
        emoji: i.emoji,
      })),
    }));

  return (
    <div className="py-8 md:py-12">
      <section className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl italic leading-snug md:text-4xl">
          People who taste{' '}
          <span className="not-italic text-accent">like you.</span>
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          Matched by shared interests — the more overlap, the closer the taste.
        </p>
      </section>

      <MatchList matches={matches} />
    </div>
  );
}
