import { SkeletonGrid } from "@/components/ui/SkeletonGrid";

export const PageSkeleton = () => (
  <div className="flex min-h-0 w-full flex-col">
    <div className="page-header flex items-center justify-between gap-4">
      <div>
        <div className="mb-0.5 font-display text-2xl font-bold tracking-tight">
          <span className="inline-block h-[0.75em] w-40 skeleton rounded align-middle" />
        </div>
        <p className="mt-0.5 text-sm">
          <span className="inline-block h-[0.7em] w-64 skeleton rounded" />
        </p>
      </div>
    </div>
    <div className="page-content min-h-0 flex-1 overflow-y-auto">
      <SkeletonGrid />
    </div>
  </div>
);
