import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

/**
 * Resolve the signed-in user plus their reciprocity-gate state.
 * Pages: redirect('/auth/signin') when null, redirect('/onboarding')
 * when !published (except the onboarding page itself).
 */
export async function getViewer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      publishedAt: true,
      isTastemaker: true,
      _count: { select: { picks: true } },
    },
  });
  if (!user) return null;

  return {
    ...user,
    pickCount: user._count.picks,
    published: user.publishedAt !== null,
  };
}
