import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** GET /api/interests — full taxonomy plus the current user's selections. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [interests, mine] = await Promise.all([
    prisma.interest.findMany({ orderBy: [{ category: 'asc' }, { label: 'asc' }] }),
    prisma.userInterest.findMany({
      where: { userId: session.user.userId },
      include: { interest: true },
    }),
  ]);

  return NextResponse.json({
    interests: interests.map((i) => ({
      slug: i.slug,
      label: i.label,
      category: i.category,
      emoji: i.emoji,
    })),
    selected: mine.map((ui) => ui.interest.slug),
  });
}

/** POST /api/interests  { slugs: string[] } — replace the user's interest set (min 3). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.userId;

  const body = await req.json().catch(() => null);
  const slugs: string[] = Array.isArray(body?.slugs) ? body.slugs.map(String) : [];

  if (slugs.length < 3) {
    return NextResponse.json(
      { error: 'Pick at least 3 interests.' },
      { status: 400 }
    );
  }

  const interests = await prisma.interest.findMany({ where: { slug: { in: slugs } } });
  if (interests.length < 3) {
    return NextResponse.json({ error: 'Unknown interests submitted.' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.userInterest.deleteMany({ where: { userId } }),
    prisma.userInterest.createMany({
      data: interests.map((i) => ({ userId, interestId: i.id })),
    }),
  ]);

  return NextResponse.json({ ok: true, count: interests.length });
}
