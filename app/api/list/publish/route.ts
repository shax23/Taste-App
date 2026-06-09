import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LIST_SIZE } from '@/lib/taste';

/**
 * POST /api/list/publish — the reciprocity gate.
 * Requires a complete list of LIST_SIZE places; unlocks browsing.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.userId;

  const count = await prisma.pick.count({ where: { userId } });
  if (count < LIST_SIZE) {
    return NextResponse.json(
      { error: `Your list has ${count} of ${LIST_SIZE} places. Complete it to publish.` },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { publishedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
