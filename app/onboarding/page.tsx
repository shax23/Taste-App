import { redirect } from 'next/navigation';
import { getViewer } from '@/lib/viewer';
import { ListBuilder } from '@/components/list/ListBuilder';
import { LIST_SIZE } from '@/lib/taste';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const viewer = await getViewer();
  if (!viewer) redirect('/auth/signin');

  return (
    <div className="mx-auto max-w-2xl py-8 md:py-12">
      <header className="mb-8">
        {viewer.published ? (
          <>
            <h1 className="font-display text-3xl italic leading-snug md:text-4xl">
              Your list<span className="not-italic text-accent">.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-text-muted">
              The {LIST_SIZE} Barcelona places you stand behind. Edit it
              occasionally — it's what people discover you by.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl italic leading-snug md:text-4xl">
              Your {LIST_SIZE} places{' '}
              <span className="not-italic text-accent">unlock everyone else's.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-text-muted">
              Taste runs on reciprocity: publish your own curated Barcelona
              list to browse anyone else's. No followers, no feeds — just the
              places you stand behind.
            </p>
          </>
        )}
      </header>
      <ListBuilder published={viewer.published} />
    </div>
  );
}
