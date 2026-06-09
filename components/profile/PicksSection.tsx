'use client';

import dynamic from 'next/dynamic';
import { Check } from 'lucide-react';
import { categoryMeta } from '@/lib/taste';
import { cn } from '@/lib/utils';
import type { PickPin } from './PickMap';

const PickMap = dynamic(() => import('./PickMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-surface-2" />,
});

/** A person's published list: their pins on a map + the ranked list with notes. */
export function PicksSection({ pins, ownerName }: { pins: PickPin[]; ownerName: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="h-80 overflow-hidden rounded-2xl border border-line lg:col-span-3 lg:h-[520px]">
        <PickMap pins={pins} />
      </div>

      <ol className="space-y-2.5 lg:col-span-2">
        {pins.map((pin) => {
          const meta = categoryMeta(pin.category);
          return (
            <li
              key={pin.rank}
              className={cn(
                'rounded-2xl border p-4',
                pin.shared
                  ? 'border-accent/40 bg-accent-light/30'
                  : 'border-line bg-surface'
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ background: meta.color }}
                >
                  {pin.rank}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{pin.name}</p>
                {pin.shared && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-light px-2 py-0.5 text-[11px] font-medium text-accent">
                    <Check size={10} /> You too
                  </span>
                )}
              </div>
              <p className="mt-1 pl-9 text-xs text-text-muted">
                {meta.emoji} {meta.label}
                {pin.neighborhood ? ` · ${pin.neighborhood}` : ''}
              </p>
              {pin.note && (
                <p className="mt-1.5 pl-9 text-sm italic leading-relaxed text-text-primary">
                  “{pin.note}”
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
