import { redirect } from 'next/navigation';
import { getViewer } from '@/lib/viewer';
import { ExploreView } from '@/components/explore/ExploreView';

export default async function ExplorePage() {
  const viewer = await getViewer();
  if (!viewer) redirect('/auth/signin');
  if (!viewer.published) redirect('/onboarding'); // reciprocity gate

  return <ExploreView userCity="Barcelona" />;
}
