import { cn } from '@/lib/utils';

type Variant = 'default' | 'accent' | 'outline' | 'tier-high' | 'tier-mid' | 'tier-low';

const variants: Record<Variant, string> = {
  default: 'bg-surface-2 text-text-muted',
  accent: 'bg-accent-light text-accent',
  outline: 'bg-transparent border border-line text-text-muted',
  'tier-high': 'bg-[#2D6A4F]/10 text-score-high',
  'tier-mid': 'bg-[#E9A826]/15 text-[#9a6d12]',
  'tier-low': 'bg-accent-light text-accent',
};

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function tierBadgeVariant(tier: string): Variant {
  if (tier === 'Authority' || tier === 'Trusted') return 'tier-high';
  if (tier === 'Established') return 'tier-mid';
  return 'tier-low';
}
