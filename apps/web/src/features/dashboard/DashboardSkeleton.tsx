import { Skeleton as SkeletonBlock } from '@/components/ui/Skeleton';

const StatCardSkeleton = () => (
  <div className="flex flex-1 items-center gap-3.5 p-4">
    <SkeletonBlock className="size-10 shrink-0 rounded-xl" />
    <div className="min-w-0 flex-1">
      <SkeletonBlock className="h-3 w-20" />
      <SkeletonBlock className="mt-1.5 h-7 w-14" />
      <SkeletonBlock className="mt-1 h-4 w-28" />
    </div>
  </div>
);

const TabsSkeleton = () => (
  <div className="inline-flex w-fit gap-1 rounded-2xl border border-border bg-base-100 p-1">
    <SkeletonBlock className="h-9 w-28 rounded-xl" />
    <SkeletonBlock className="h-9 w-44 rounded-xl" />
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
  <div className="flex flex-col gap-3">
    <TabsSkeleton />
    <div className="overflow-hidden rounded-2xl border border-border bg-base-100 shadow-card [&>div+div]:border-t [&>div+div]:border-base-content/8">
      {[0, 1, 2, 3].map((i) => (
        <RunRowSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div aria-hidden="true">
    <header className="page-header">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <SkeletonBlock className="h-8 w-64 sm:h-9" />
          <SkeletonBlock className="mt-1.5 h-5 w-72" />
        </div>
        <SkeletonBlock className="h-5 w-32" />
      </div>
    </header>

    <section className="page-content flex flex-col gap-8">
      <div className="flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-base-100 shadow-card sm:flex-row [&>*+*]:border-t [&>*+*]:border-base-content/8 sm:[&>*+*]:border-t-0 sm:[&>*+*]:border-l">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <RunsTableSkeleton />
    </section>
  </div>
);
