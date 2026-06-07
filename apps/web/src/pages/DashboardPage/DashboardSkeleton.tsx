import { ActiveRunsSkeleton } from "@/pages/DashboardPage/ActiveRunsSkeleton";

export const DashboardSkeleton = () => (
  <div className="flex min-h-0 w-full flex-col">
    <div className="page-header flex items-center justify-between gap-4">
      <div>
        <div className="mb-0.5 font-display text-2xl font-bold tracking-tight">
          <span className="inline-block h-[0.75em] w-32 skeleton rounded align-middle" />
        </div>
        <p className="mt-0.5 text-sm">
          <span className="inline-block h-[0.7em] w-52 skeleton rounded" />
        </p>
      </div>
      <div className="btn pointer-events-none btn-square shrink-0 skeleton rounded-xl btn-lg" />
    </div>
    <div className="page-content flex flex-col gap-6">
      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-base-content/20 bg-base-100 p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-block h-[0.65em] w-20 skeleton rounded" />
              <span className="size-5 skeleton rounded" />
            </div>
            <div className="h-9 w-16 skeleton rounded" />
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        <span className="mb-3 inline-block h-[0.65em] w-24 skeleton rounded" />
        <ActiveRunsSkeleton />
      </div>
    </div>
  </div>
);
