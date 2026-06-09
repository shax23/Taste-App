import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CITY, toPickCategory } from '@/lib/taste';

/**
 * GET /api/places/suggestions?categories=cafe,bar&neighborhoods=Gràcia,El Born
 * Curated Barcelona places for the onboarding list builder, filtered by the
 * preferences chosen in earlier steps and ranked by how many people picked them
 * (popularity). Excludes places already on the viewer's list.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.userId;

  const { searchParams } = new URL(req.url);
  const categories = (searchParams.get('categories') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const neighborhoods = (searchParams.get('neighborhoods') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const mine = new Set(
    (await prisma.pick.findMany({ where: { userId }, select: { placeId: true } })).map(
      (p) => p.placeId
    )
  );

  const places = await prisma.place.findMany({
    where: { city: CITY },
    include: { _count: { select: { picks: true } } },
  });

  const scored = places
    .filter((p) => !mine.has(p.id))
    .map((p) => {
      const pickCat = toPickCategory(p.category);
      const catMatch = categories.length === 0 || categories.includes(pickCat);
      const hoodMatch =
        neighborhoods.length === 0 ||
        (p.neighborhood ? neighborhoods.includes(p.neighborhood) : false);
      // preference relevance, then popularity
      const relevance =
        (catMatch ? 2 : 0) + (hoodMatch ? 1 : 0);
      return {
        place: {
          id: p.id,
          name: p.name,
          category: pickCat,
          address: p.address,
          neighborhood: p.neighborhood,
          lat: p.lat,
          lng: p.lng,
        },
        relevance,
        popularity: p._count.picks,
        catMatch,
      };
    })
    // when categories are chosen, only surface those; neighborhood is a soft boost
    .filter((s) => (categories.length === 0 ? true : s.catMatch))
    .sort((a, b) => b.relevance - a.relevance || b.popularity - a.popularity)
    .slice(0, 24)
    .map((s) => s.place);

  return NextResponse.json({ results: scored });
}
