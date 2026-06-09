import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { categoryMeta } from '@/lib/taste';

export type PersonCardData = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isTastemaker: boolean;
  sharedPlaceCount: number;
  percent: number;
  sharedPlaceNames: string[];
  preview: { name: string; category: string }[]; // top of their list
};

export function PersonCard({ person }: { person: PersonCardData }) {
  return (
    <Link
      href={`/profile/${person.username}`}
      className="group block rounded-2xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <Avatar src={person.avatarUrl} name={person.displayName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium group-hover:text-accent">
              {person.displayName}
            </p>
            {person.isTastemaker && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-light px-2 py-0.5 text-[11px] font-medium text-accent">
                <Sparkles size={10} /> Tastemaker
              </span>
            )}
          </div>
          <p className="truncate text-xs text-text-muted">@{person.username}</p>
        </div>
        {person.sharedPlaceCount > 0 ? (
          <div className="shrink-0 text-right">
            <p className="text-lg font-medium text-accent">{person.percent}%</p>
            <p className="text-[11px] text-text-muted">match</p>
          </div>
        ) : null}
      </div>

      {person.bio && (
        <p className="mt-3 line-clamp-1 text-xs text-text-muted">{person.bio}</p>
      )}

      {/* top of their list */}
      <ul className="mt-3 space-y-1">
        {person.preview.map((p, i) => {
          const meta = categoryMeta(p.category);
          return (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span aria-hidden className="text-xs">
                {meta.emoji}
              </span>
              <span className="truncate">{p.name}</span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-text-muted">
        {person.sharedPlaceCount > 0 ? (
          <>
            <span className="font-medium text-text-primary">
              {person.sharedPlaceCount} {person.sharedPlaceCount === 1 ? 'place' : 'places'} in
              common
            </span>
            {person.sharedPlaceNames.length > 0 && (
              <> — {person.sharedPlaceNames.slice(0, 2).join(', ')}</>
            )}
          </>
        ) : (
          'No overlap yet — their list might surprise you'
        )}
      </p>
    </Link>
  );
}
