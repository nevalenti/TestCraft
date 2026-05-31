import { SkeletonGrid } from "@/components/ui/SkeletonGrid";

export const PageSkeleton = () => (
  <div className="w-full flex flex-col min-h-0">
    <div className="page-header flex items-center justify-between gap-4">
      <div>
        <div className="text-2xl font-bold tracking-tight font-display mb-0.5">
          <span className="skeleton inline-block w-40 h-[0.75em] rounded align-middle" />
        </div>
        <p className="mt-0.5 text-sm">
          <span className="skeleton inline-block w-64 h-[0.7em] rounded" />
        </p>
      </div>
      <div className="btn btn-sm skeleton pointer-events-none w-24 shrink-0" />
    </div>
    <div className="page-content overflow-y-auto min-h-0 flex-1">
      <SkeletonGrid />
    </div>
  </div>
);
