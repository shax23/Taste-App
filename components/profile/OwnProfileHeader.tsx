'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Pencil, HelpCircle, X, Check } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, tierBadgeVariant } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/profile/CredibilityScore';

type Props = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string;
  score: number;
  tier: string;
  interests: { slug: string; label: string; emoji: string }[];
};

export function OwnProfileHeader(props: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(props.bio ?? '');
  const [city, setCity] = useState(props.city);
  const [saving, setSaving] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, city }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  return (
    <header className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:gap-10 md:text-left">
      <Avatar src={props.avatarUrl} name={props.displayName} size="xl" />

      <div className="flex-1">
        <div className="flex flex-col items-center gap-2 md:flex-row md:items-baseline md:gap-3">
          <h1 className="font-display text-3xl">{props.displayName}</h1>
          <span className="text-sm text-text-muted">@{props.username}</span>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="mx-auto mt-3 max-w-md space-y-3 md:mx-0">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm focus:border-accent focus:outline-none"
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A line or two about your taste"
              rows={3}
              maxLength={280}
              className="w-full resize-none rounded-xl border border-line bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            <div className="flex justify-center gap-2 md:justify-start">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <Check size={14} /> {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setBio(props.bio ?? '');
                  setCity(props.city);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-text-muted"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-text-muted md:justify-start">
              <MapPin size={13} strokeWidth={1.8} />
              {props.city}
            </p>
            {props.bio && (
              <p className="mt-3 max-w-md text-sm leading-relaxed">{props.bio}</p>
            )}
          </>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 md:justify-start">
          {props.interests.map((interest) => (
            <span
              key={interest.slug}
              className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent"
            >
              <span aria-hidden>{interest.emoji}</span>
              {interest.label}
            </span>
          ))}
          <Link
            href="/interests"
            className="inline-flex items-center rounded-full border border-dashed border-line px-2.5 py-0.5 text-xs text-text-muted hover:border-accent hover:text-accent"
          >
            + edit interests
          </Link>
        </div>
      </div>

      <div className="relative flex flex-col items-center">
        <ScoreRing score={props.score} size={120} tierLabel={props.tier} />
        <Badge variant={tierBadgeVariant(props.tier)} className="mt-2">
          {props.tier}
        </Badge>
        <button
          onClick={() => setShowExplainer((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent"
        >
          <HelpCircle size={12} />
          What affects my score?
        </button>
        {showExplainer && (
          <div className="absolute top-full z-10 mt-2 w-72 rounded-xl border border-line bg-surface p-4 text-left text-xs leading-relaxed text-text-muted shadow-sm">
            <p className="mb-1 font-medium text-text-primary">Your credibility grows from:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <span className="text-text-primary">Taste signal</span> — consistent,
                interest-tagged posting (recent posts count double)
              </li>
              <li>
                <span className="text-text-primary">Peer validation</span> — people who
                share your interests confirming &ldquo;I tried this, it delivered&rdquo;
              </li>
              <li>
                <span className="text-text-primary">Consistency</span> — showing up most
                weeks and posting new places
              </li>
              <li>
                <span className="text-text-primary">Imported boost</span> — follower
                cold-start credit that decays to zero after 90 days
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
