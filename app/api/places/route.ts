import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/places?city=Barcelona&category=cafe
 * Places with post counts from taste-matched users (users sharing ≥1 interest
 * with the current user) and the top interest tags of those users.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.userId;

  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');
  const category = searchParams.get('category');

  const myInterests = await prisma.userInterest.findMany({
    where: { userId },
    select: { interestId: true },
  });
  const myInterestIds = new Set(myInterests.map((i) => i.interestId));

  const where: any = {};
  if (city && city !== 'all') where.city = city;
  if (category && category !== 'all') where.category = category;

  const places = await prisma.place.findMany({
    where,
    include: {
      posts: {
        include: {
          user: { include: { interests: { include: { interest: true } } } },
          interests: { include: { interest: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const items = places.map((place) => {
    const matchedPosts = place.posts.filter((p) =>
      p.user.interests.some((ui) => myInterestIds.has(ui.interestId))
    );
    // top interest tags across taste-matched posters
    const tagCounts = new Map<string, { label: string; emoji: string; count: number }>();
    for (const post of matchedPosts) {
      for (const pi of post.interests) {
        const entry = tagCounts.get(pi.interest.slug) ?? {
          label: pi.interest.label,
          emoji: pi.interest.emoji,
          count: 0,
        };
        entry.count++;
        tagCounts.set(pi.interest.slug, entry);
      }
    }
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([slug, t]) => ({ slug, label: t.label, emoji: t.emoji }));

    return {
      id: place.id,
      name: place.name,
      category: place.category,
      address: place.address,
      city: place.city,
      lat: place.lat,
      lng: place.lng,
      coverImage: place.coverImage,
      matchedPostCount: matchedPosts.length,
      totalPostCount: place.posts.length,
      topTags,
    };
  });

  return NextResponse.json({ places: items });
}
