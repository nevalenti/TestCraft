import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { cn } from "@/lib/cn";

export type ViewMode = "grid" | "list";

const TITLE_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-3/5", "w-4/5", "w-1/2"];
const SUBTITLE_WIDTHS = ["w-1/2", "w-2/3", "w-2/5", "w-1/2", "w-1/3", "w-3/5"];

const pick = (widths: string[], index: number) => widths[index % widths.length];

const ResourceCardSkeleton = ({ index }: { index: number }) => (
  <div className="flex items-start gap-3 rounded-xl border border-border bg-base-100 p-4 shadow-card">
    <Skeleton className="size-7 shrink-0 rounded-lg" />
    <div className="flex min-w-0 flex-1 flex-col gap-2 pr-9">
      <div className="flex flex-col gap-1.5">
        <Skeleton className={cn("h-4", pick(TITLE_WIDTHS, index))} />
        <Skeleton className={cn("h-3.5", pick(SUBTITLE_WIDTHS, index))} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-14 rounded-full" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  </div>
);

const ResourceListItemSkeleton = ({ index }: { index: number }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-base-100 px-4 py-2.5 shadow-card">
    <Skeleton className="size-7 shrink-0 rounded-lg" />
    <div className="flex min-w-0 flex-1 flex-col gap-1 py-1.5">
      <Skeleton className={cn("h-4 max-w-sm", pick(TITLE_WIDTHS, index))} />
      <Skeleton
        className={cn("h-3.5 max-w-xs", pick(SUBTITLE_WIDTHS, index))}
      />
    </div>
  </div>
);

interface ResourceSkeletonProps {
  viewMode: ViewMode;
  count?: number;
}

export const ResourceSkeleton = ({
  viewMode,
  count = 6,
}: ResourceSkeletonProps) => {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }, (_, i) => (
          <ResourceListItemSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ResourceCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
};
