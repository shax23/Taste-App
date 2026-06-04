import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { MapPin } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { loadProfile } from '@/lib/profile';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, tierBadgeVariant } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/profile/CredibilityScore';
import { CredibilityBreakdown } from '@/components/profile/CredibilityBreakdown';
import { TasteMap } from '@/components/profile/TasteMap';
import { ProfileTabs } from '@/components/profile/ProfileTabs';

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) redirect('/auth/signin');
  if (params.username === session.user.username) redirect('/profile/me');

  const profile = await loadProfile(params.username);
  if (!profile) notFound();

  const joined = profile.user.createdAt.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="py-8 md:py-12">
      {/* header */}
      <header className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:gap-10 md:text-left">
        <Avatar src={profile.user.avatarUrl} name={profile.user.displayName} size="xl" />
        <div className="flex-1">
          <div className="flex flex-col items-center gap-2 md:flex-row md:items-baseline md:gap-3">
            <h1 className="font-display text-3xl">{profile.user.displayName}</h1>
            <span className="text-sm text-text-muted">@{profile.user.username}</span>
          </div>
          <p className="mt-1 flex items-center justify-center gap-1 text-sm text-text-muted md:justify-start">
            <MapPin size={13} strokeWidth={1.8} />
            {profile.user.city}
          </p>
          {profile.user.bio && (
            <p className="mt-3 max-w-md text-sm leading-relaxed">{profile.user.bio}</p>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5 md:justify-start">
            {profile.interests.slice(0, 5).map((interest) => (
              <span
                key={interest.slug}
                className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent"
              >
                <span aria-hidden>{interest.emoji}</span>
                {interest.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <ScoreRing
            score={profile.score.totalScore}
            size={120}
            tierLabel={profile.score.tier}
          />
          <Badge variant={tierBadgeVariant(profile.score.tier)} className="mt-2">
            {profile.score.tier}
          </Badge>
        </div>
      </header>

      {/* breakdown + taste map */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <CredibilityBreakdown
          tasteSignalStrength={profile.score.tasteSignalStrength}
          peerValidationDensity={profile.score.peerValidationDensity}
          consistencyBonus={profile.score.consistencyBonus}
          importedFollowerScore={profile.score.importedFollowerScore}
        />
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-medium">Taste map</h2>
          <TasteMap data={profile.tasteMap} />
        </div>
      </div>

      {/* tabs */}
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
