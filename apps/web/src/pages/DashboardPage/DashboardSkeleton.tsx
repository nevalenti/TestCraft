import { ActiveRunsSkeleton } from "@/pages/DashboardPage/ActiveRunsSkeleton";

export const DashboardSkeleton = () => (
  <div className="w-full flex flex-col min-h-0">
    <div className="page-header flex items-center justify-between gap-4">
      <div>
        <div className="text-2xl font-bold tracking-tight font-display mb-0.5">
          <span className="skeleton inline-block w-32 h-[0.75em] rounded align-middle" />
        </div>
        <p className="mt-0.5 text-sm">
          <span className="skeleton inline-block w-52 h-[0.7em] rounded" />
        </p>
      </div>
      <div className="btn btn-lg btn-square rounded-xl skeleton pointer-events-none shrink-0" />
    </div>
    <div className="page-content flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-base-content/20 bg-base-100 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="skeleton inline-block w-20 h-[0.65em] rounded" />
              <span className="skeleton size-5 rounded" />
            </div>
            <div className="skeleton h-9 w-16 rounded" />
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        <span className="skeleton inline-block w-24 h-[0.65em] rounded mb-3" />
        <ActiveRunsSkeleton />
      </div>
    </div>
  </div>
);
