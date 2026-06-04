'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Row = {
  label: string;
  value: number;
  max: number;
  note?: string;
  muted?: boolean;
};

function Bar({ row, index }: { row: Row; index: number }) {
  const pct = Math.min(100, (row.value / row.max) * 100);
  return (
    <div className={cn(row.muted && 'opacity-50')}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm">{row.label}</span>
        <span className="text-sm tabular-nums text-text-muted">
          {Math.round(row.value)}/{row.max}
          {row.note && <span className="ml-1.5 text-xs italic">({row.note})</span>}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full"
          style={{ background: row.muted ? 'var(--text-muted)' : 'var(--accent)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function CredibilityBreakdown({
  tasteSignalStrength,
  peerValidationDensity,
  consistencyBonus,
  importedFollowerScore,
  defaultOpen = false,
}: {
  tasteSignalStrength: number;
  peerValidationDensity: number;
  consistencyBonus: number;
  importedFollowerScore: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const rows: Row[] = [
    { label: 'Taste Signal Strength', value: tasteSignalStrength, max: 100 },
    { label: 'Peer Validation Density', value: peerValidationDensity, max: 100 },
    { label: 'Consistency Bonus', value: consistencyBonus, max: 20 },
    {
      label: 'Imported Boost',
      value: importedFollowerScore,
      max: 20,
      note: 'decaying',
      muted: true,
    },
  ];

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium">Credibility breakdown</span>
        <ChevronDown
          size={16}
          className={cn('text-text-muted transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="space-y-4 border-t border-line px-5 py-5">
          {rows.map((row, i) => (
            <Bar key={row.label} row={row} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
