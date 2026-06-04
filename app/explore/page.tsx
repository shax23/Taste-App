import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExploreView } from '@/components/explore/ExploreView';

export default async function ExplorePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) redirect('/auth/signin');

  const user = await prisma.user.findUnique({
    where: { id: session.user.userId },
    select: { city: true },
  });

  return <ExploreView userCity={user?.city ?? 'Barcelona'} />;
}
