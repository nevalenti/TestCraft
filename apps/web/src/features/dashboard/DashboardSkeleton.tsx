import { Skeleton as SkeletonBlock } from '@/components/ui/Skeleton';

const TabsSkeleton = () => (
  <div className="flex items-center gap-6 px-4 py-3">
    <SkeletonBlock className="h-4 w-24" />
    <SkeletonBlock className="h-4 w-40" />
  </div>
);

const RunRowSkeleton = () => (
  <div className="flex items-center gap-3 px-4 py-2.5">
    <SkeletonBlock className="size-8 shrink-0 rounded-full" />
    <SkeletonBlock className="h-4 w-40 shrink-0" />
    <SkeletonBlock className="hidden h-4 w-24 shrink-0 sm:block" />
    <SkeletonBlock className="hidden h-4 w-16 shrink-0 sm:block" />
    <SkeletonBlock className="h-1.5 min-w-16 flex-1 rounded-full" />
    <SkeletonBlock className="h-4 w-14 shrink-0" />
  </div>
);

const RunsTableSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-border bg-base-100 shadow-card [&>div+div]:border-t [&>div+div]:border-base-content/8">
    <TabsSkeleton />
    {[0, 1, 2, 3].map((i) => (
      <RunRowSkeleton key={i} />
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div aria-hidden="true">
    <header className="page-header">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <SkeletonBlock className="h-6 w-56" />
          <SkeletonBlock className="mt-1.5 h-5 w-72" />
        </div>
        <SkeletonBlock className="h-5 w-32" />
      </div>
    </header>

    <section className="page-content flex flex-col gap-8">
      <RunsTableSkeleton />
    </section>
  </div>
);
