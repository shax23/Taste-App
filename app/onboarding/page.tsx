import { redirect } from 'next/navigation';
import { getViewer } from '@/lib/viewer';
import { ListBuilder } from '@/components/list/ListBuilder';
import { OnboardingFlow } from '@/components/list/OnboardingFlow';
import { LIST_SIZE } from '@/lib/taste';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const viewer = await getViewer();
  if (!viewer) redirect('/auth/signin');

  // First-time users get the guided, stepped flow with preference questions.
  if (!viewer.published) {
    return (
      <div className="py-8 md:py-12">
        <OnboardingFlow />
      </div>
    );
  }

  // Returning users edit their published list directly.
  return (
    <div className="mx-auto max-w-2xl py-8 md:py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl italic leading-snug md:text-4xl">
          Your list<span className="not-italic text-accent">.</span>
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-text-muted">
          The {LIST_SIZE} Barcelona places you stand behind. Edit it
          occasionally — it's what people discover you by.
        </p>
      </header>
      <ListBuilder published={viewer.published} />
    </div>
  );
}
