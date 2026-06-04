import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recalculateAndStore, tierForScore } from '@/lib/credibility';

const STALE_MS = 60 * 60 * 1000; // 1 hour

/**
 * GET /api/credibility/[userId]
 * Full score breakdown. Recalculates when lastCalculated is >1 hour old.
 */
export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: { credibilityScore: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  let score = user.credibilityScore;
  if (!score || Date.now() - score.lastCalculated.getTime() > STALE_MS) {
    await recalculateAndStore(user.id);
    score = await prisma.credibilityScore.findUnique({ where: { userId: user.id } });
  }

  return NextResponse.json({
    userId: user.id,
    username: user.username,
    totalScore: score?.totalScore ?? 0,
    tasteSignalStrength: score?.tasteSignalStrength ?? 0,
    peerValidationDensity: score?.peerValidationDensity ?? 0,
    consistencyBonus: score?.consistencyBonus ?? 0,
    importedFollowerScore: score?.importedFollowerScore ?? 0,
    tier: tierForScore(score?.totalScore ?? 0),
    lastCalculated: score?.lastCalculated ?? null,
  });
}
