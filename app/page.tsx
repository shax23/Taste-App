import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { FeedList } from '@/components/feed/FeedList';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) redirect('/auth/signin');

  const myInterests = await prisma.userInterest.findMany({
    where: { userId: session.user.userId },
    include: { interest: true },
    orderBy: { strength: 'desc' },
    take: 3,
  });

  if (myInterests.length === 0) redirect('/interests');

  return (
    <div className="py-8 md:py-12">
      <section className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl italic leading-snug md:text-4xl">
          What people like you are doing{' '}
          <span className="not-italic text-accent">right now.</span>
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          {myInterests.map(({ interest }) => (
            <span
              key={interest.slug}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent"
            >
              <span aria-hidden>{interest.emoji}</span>
              {interest.label}
            </span>
          ))}
        </div>
      </section>

      <div className="max-w-2xl">
        <FeedList />
      </div>
    </div>
  );
}
