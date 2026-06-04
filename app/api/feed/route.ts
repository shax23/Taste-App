import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tierForScore } from '@/lib/credibility';

const PAGE_SIZE = 10;

/**
 * GET /api/feed?category=food&interestFilter=specialty-coffee&page=1
 * Posts from users who share ≥1 interest with the current user,
 * ranked by poster credibility score descending.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.userId;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const category = searchParams.get('category');
  const interestFilter = searchParams.get('interestFilter');

  const myInterests = await prisma.userInterest.findMany({
    where: { userId },
    select: { interestId: true },
  });
  const myInterestIds = myInterests.map((i) => i.interestId);

  if (myInterestIds.length === 0) {
    return NextResponse.json({ posts: [], hasMore: false, needsOnboarding: true });
  }

  const where: any = {
    userId: { not: userId },
    user: { interests: { some: { interestId: { in: myInterestIds } } } },
  };
  if (interestFilter) {
    where.interests = { some: { interest: { slug: interestFilter } } };
  } else if (category && category !== 'all') {
    where.interests = { some: { interest: { category } } };
  }

  const posts = await prisma.post.findMany({
    where,
    include: {
      user: {
        include: { credibilityScore: true },
      },
      place: true,
      interests: { include: { interest: true } },
      validations: { where: { validatorId: userId }, select: { id: true } },
    },
    orderBy: [
      { user: { credibilityScore: { totalScore: 'desc' } } },
      { createdAt: 'desc' },
    ],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
  });

  const hasMore = posts.length > PAGE_SIZE;
  const myInterestSet = new Set(myInterestIds);

  const items = posts.slice(0, PAGE_SIZE).map((p) => {
    const score = p.user.credibilityScore?.totalScore ?? 0;
    return {
      id: p.id,
      content: p.content,
      postType: p.postType,
      createdAt: p.createdAt,
      user: {
        username: p.user.username,
        displayName: p.user.displayName,
        avatarUrl: p.user.avatarUrl,
        city: p.user.city,
        score,
        tier: tierForScore(score),
      },
      place: p.place
        ? { id: p.place.id, name: p.place.name, category: p.place.category, city: p.place.city }
        : null,
      interests: p.interests.map((pi) => ({
        slug: pi.interest.slug,
        label: pi.interest.label,
        emoji: pi.interest.emoji,
        category: pi.interest.category,
        shared: myInterestSet.has(pi.interestId),
      })),
      alreadyValidated: p.validations.length > 0,
    };
  });

  return NextResponse.json({ posts: items, hasMore });
}
