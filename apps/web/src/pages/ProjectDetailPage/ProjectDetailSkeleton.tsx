import { ViewModeSkeleton } from "@/components/ui/ViewModeSkeleton";

export const ProjectDetailSkeleton = () => (
  <div className="flex min-h-0 w-full flex-col">
    <div className="page-header flex items-center justify-between gap-4">
      <div>
        <div className="mb-0.5 font-display text-2xl font-bold tracking-tight">
          <span className="inline-block h-[0.75em] w-52 skeleton rounded align-middle" />
        </div>
        <p className="mt-0.5 text-sm">
          <span className="inline-block h-[0.7em] w-80 skeleton rounded" />
        </p>
      </div>
      <div className="h-9 w-60 skeleton rounded-xl border border-border" />
    </div>
    <div className="page-content">
      <ViewModeSkeleton />
    </div>
  </div>
);
