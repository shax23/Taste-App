'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

function scoreColor(score: number): string {
  if (score > 60) return 'var(--score-high)';
  if (score > 30) return 'var(--score-mid)';
  return 'var(--score-low)';
}

/**
 * Credibility score ring — SVG circle with animated stroke-dashoffset.
 * `size` is the outer diameter in px.
 */
export function ScoreRing({
  score,
  size = 40,
  strokeWidth,
  showNumber = true,
  tierLabel,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  showNumber?: boolean;
  tierLabel?: string;
  className?: string;
}) {
  const sw = strokeWidth ?? Math.max(3, size / 14);
  const r = (size - sw) / 2;
  const circumference = 2 * Math.PI * r;
  const target = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  const color = scoreColor(score);

  return (
    <div
      className={cn('relative inline-flex flex-col items-center', className)}
      style={{ width: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={sw}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: target }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      {showNumber && (
        <span
          className="absolute inset-0 flex items-center justify-center font-medium tabular-nums"
          style={{ fontSize: size / 3.4, color }}
        >
          {Math.round(score)}
        </span>
      )}
      {tierLabel && (
        <span className="mt-2 text-sm text-text-muted">{tierLabel}</span>
      )}
    </div>
  );
}
