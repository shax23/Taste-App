import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { loadProfile } from '@/lib/profile';
import { OwnProfileHeader } from '@/components/profile/OwnProfileHeader';
import { CredibilityBreakdown } from '@/components/profile/CredibilityBreakdown';
import { TasteMap } from '@/components/profile/TasteMap';
import { ProfileTabs } from '@/components/profile/ProfileTabs';

export default async function MyProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.username) redirect('/auth/signin');

  const profile = await loadProfile(session.user.username);
  if (!profile) redirect('/auth/signin');

  const joined = profile.user.createdAt.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="py-8 md:py-12">
      <OwnProfileHeader
        displayName={profile.user.displayName}
        username={profile.user.username}
        avatarUrl={profile.user.avatarUrl}
        bio={profile.user.bio}
        city={profile.user.city}
        score={profile.score.totalScore}
        tier={profile.score.tier}
        interests={profile.interests}
      />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <CredibilityBreakdown
          tasteSignalStrength={profile.score.tasteSignalStrength}
          peerValidationDensity={profile.score.peerValidationDensity}
          consistencyBonus={profile.score.consistencyBonus}
          importedFollowerScore={profile.score.importedFollowerScore}
          defaultOpen
        />
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-medium">Taste map</h2>
          <TasteMap data={profile.tasteMap} />
        </div>
      </div>

      <div className="mt-10">
        <ProfileTabs
          posts={profile.posts}
          places={profile.places}
          about={{ bio: profile.user.bio, city: profile.user.city, joined }}
        />
      </div>
    </div>
  );
}
