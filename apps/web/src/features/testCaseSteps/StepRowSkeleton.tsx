import { Skeleton } from '@/components/ui/Skeleton';

export const StepRowSkeleton = () => (
  <div className="rounded-lg border border-base-content/20 bg-base-100 shadow-card">
    <div className="flex items-start gap-3 p-4 pr-24">
      <Skeleton className="size-8 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1">
        <div className="mb-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
          <div>
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  </div>
);
