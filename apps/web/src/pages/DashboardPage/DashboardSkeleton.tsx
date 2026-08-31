import { Skeleton as SkeletonBlock } from '@/components/ui/Skeleton';
import { RunSummarySkeleton } from '@/pages/DashboardPage/RunListItemParts';

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

const RunRowSkeleton = () => (
  <div className="flex items-center gap-3 px-4 py-2">
    <SkeletonBlock className="size-8 shrink-0 rounded-full" />
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-5 w-2/5" />
          <SkeletonBlock className="mt-0.5 h-4 w-3/5" />
        </div>
        <SkeletonBlock className="h-4 w-10 shrink-0 rounded-full" />
      </div>
      <RunSummarySkeleton />
    </div>
  </div>
);

const RunListSkeleton = () => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2.5">
      <SkeletonBlock className="size-6 shrink-0 rounded-lg" />
      <SkeletonBlock className="h-5 w-28" />
    </div>
    <div className="overflow-hidden rounded-2xl border border-border bg-base-100 shadow-card [&>div+div]:border-t [&>div+div]:border-base-content/8">
      {[0, 1, 2].map((i) => (
        <RunRowSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div aria-hidden="true">
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-4 pt-8 pb-6 sm:px-6 lg:px-8">
      <div>
        <SkeletonBlock className="h-8 w-64 sm:h-9" />
        <SkeletonBlock className="mt-1.5 h-5 w-72" />
      </div>
      <SkeletonBlock className="h-5 w-32" />
    </header>

    <section className="page-content flex flex-col gap-8">
      <div className="flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-base-100 shadow-card sm:flex-row [&>*+*]:border-t [&>*+*]:border-base-content/8 sm:[&>*+*]:border-t-0 sm:[&>*+*]:border-l">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RunListSkeleton />
        <RunListSkeleton />
      </div>
    </section>
  </div>
);
