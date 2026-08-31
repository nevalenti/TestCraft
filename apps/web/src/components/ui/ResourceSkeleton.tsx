import { Skeleton } from '@/components/ui/Skeleton';
import type { ViewMode } from '@/stores/viewMode';

const ResourceCardSkeleton = () => (
  <div className="rounded-xl border border-border bg-base-100 shadow-card">
    <div className="flex min-h-[92px] flex-col justify-between p-3.5 pr-9">
      <div className="mb-2 flex items-center gap-1.5">
        <Skeleton className="size-6 shrink-0 rounded-lg" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
    </div>
  </div>
);

const ResourceListItemSkeleton = () => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-base-100 px-4 py-2 shadow-card">
    <Skeleton className="size-7 shrink-0 rounded-lg" />
    <div className="flex min-w-0 flex-1 flex-col gap-1 py-1.5">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-3.5 w-1/3" />
    </div>
  </div>
);

export const ResourceSkeleton = ({
  viewMode,
  count = 6,
}: {
  viewMode: ViewMode;
  count?: number;
}) => {
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }, (_, i) => (
          <ResourceListItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ResourceCardSkeleton key={i} />
      ))}
    </div>
  );
};
