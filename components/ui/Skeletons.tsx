export function FeedCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-32" />
          <div className="skeleton h-3 w-20" />
        </div>
        <div className="skeleton h-10 w-10 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-5/6" />
        <div className="skeleton h-3.5 w-2/3" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function PlaceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="skeleton mb-3 h-32 w-full rounded-xl" />
      <div className="space-y-2">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-3 w-24" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="py-10">
      <div className="flex flex-col items-center gap-4">
        <div className="skeleton h-24 w-24 rounded-full" />
        <div className="skeleton h-5 w-48" />
        <div className="skeleton h-3.5 w-32" />
        <div className="skeleton h-[120px] w-[120px] rounded-full" />
      </div>
    </div>
  );
}
