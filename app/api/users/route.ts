import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tierForScore } from '@/lib/credibility';

/** GET /api/users?q=mi — search users by username/display name. */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { username: { contains: q } },
            { displayName: { contains: q } },
          ],
        }
      : undefined,
    include: { credibilityScore: true },
    orderBy: { credibilityScore: { totalScore: 'desc' } },
    take: 20,
  });

  return NextResponse.json({
    users: users.map((u) => ({
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      city: u.city,
      score: u.credibilityScore?.totalScore ?? 0,
      tier: tierForScore(u.credibilityScore?.totalScore ?? 0),
    })),
  });
}

/** PATCH /api/users — update own profile (bio, city, displayName). */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const data: Record<string, string> = {};

  if (typeof body?.bio === 'string') data.bio = body.bio.slice(0, 280);
  if (typeof body?.city === 'string' && body.city.trim()) data.city = body.city.trim().slice(0, 50);
  if (typeof body?.displayName === 'string' && body.displayName.trim()) {
    data.displayName = body.displayName.trim().slice(0, 50);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.userId },
    data,
  });

  return NextResponse.json({
    ok: true,
    user: { bio: user.bio, city: user.city, displayName: user.displayName },
  });
}
