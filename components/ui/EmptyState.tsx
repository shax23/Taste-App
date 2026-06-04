import { LucideIcon, Compass } from 'lucide-react';

export function EmptyState({
  icon: Icon = Compass,
  message,
  cta,
}: {
  icon?: LucideIcon;
  message: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Icon size={28} className="text-text-muted/60" strokeWidth={1.5} />
      <p className="max-w-xs text-sm text-text-muted">{message}</p>
      {cta}
    </div>
  );
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-sm text-text-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
