import { SkeletonGrid } from "@/components/ui/SkeletonGrid";

export const PageSkeleton = () => (
  <div className="w-full flex flex-col">
    <div className="page-header">
      <div className="skeleton h-6 w-40 mb-1.5" />
      <div className="skeleton h-4 w-64" />
    </div>
    <div className="page-content">
      <SkeletonGrid />
    </div>
  </div>
);
