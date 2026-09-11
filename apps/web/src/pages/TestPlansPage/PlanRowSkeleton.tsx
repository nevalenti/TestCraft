import { Skeleton } from '@/components/ui/Skeleton';

export const PlanRowSkeleton = () => (
  <li className="flex items-center justify-between gap-4 rounded-xl border border-border bg-base-100 px-4 py-2.5">
    <div className="min-w-0 flex-1">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <Skeleton className="mt-2 h-3 w-1/4" />
    </div>
    <div className="flex items-center gap-1.5">
      <Skeleton className="size-6 rounded-md" />
      <Skeleton className="size-6 rounded-md" />
    </div>
  </li>
);
