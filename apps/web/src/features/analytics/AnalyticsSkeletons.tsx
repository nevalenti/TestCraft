import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { SkeletonStatus } from "@/components/ui/skeleton/SkeletonStatus";
import { TableSkeleton } from "@/components/ui/skeleton/TableSkeleton";

const AREA_SHAPE =
  "polygon(0% 62%, 9% 48%, 18% 55%, 27% 34%, 36% 40%, 45% 22%, 54% 30%, 63% 18%, 72% 26%, 81% 12%, 90% 20%, 100% 8%, 100% 100%, 0% 100%)";

const BAR_HEIGHTS = ["68%", "92%", "54%", "80%", "40%", "74%", "60%"];

const StatChipsSkeleton = ({ count }: { count: number }) => (
  <div className="flex flex-wrap gap-2">
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
      >
        <Skeleton className="h-6 w-6" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
    ))}
  </div>
);

const StatTileSkeleton = () => (
  <div className="panel px-4 py-3">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="mt-2.5 h-6 w-14" />
    <Skeleton className="mt-2 h-2.5 w-28" />
  </div>
);

const TrendSectionSkeleton = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Skeleton className="size-2.5 rounded-full" />
      <Skeleton className="h-3.5 w-24" />
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <StatTileSkeleton key={i} />
      ))}
    </div>
    <div className="panel px-4 pt-4 pb-4">
      <Skeleton className="mb-4 h-3 w-36" />
      <Skeleton
        className="h-[196px] w-full rounded-none opacity-60"
        style={{ clipPath: AREA_SHAPE }}
      />
    </div>
  </div>
);

export const TrendSkeleton = () => (
  <SkeletonStatus label="Loading trend data…" className="space-y-8 pb-10">
    <TrendSectionSkeleton />
    <TrendSectionSkeleton />
  </SkeletonStatus>
);

export const SuiteChartSkeleton = () => (
  <SkeletonStatus
    label="Loading suite breakdown…"
    className="rounded-xl border border-border bg-base-100 px-4 pt-4 pb-3"
  >
    <Skeleton className="mb-4 h-3 w-48" />
    <div className="flex h-[248px] items-end gap-[4%] border-b border-border px-8">
      {BAR_HEIGHTS.map((height, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t-md rounded-b-none opacity-60"
          style={{ height }}
        />
      ))}
    </div>
    <div className="mt-3 flex justify-center gap-4">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Skeleton className="size-2 rounded-full" />
          <Skeleton className="h-2.5 w-10" />
        </div>
      ))}
    </div>
  </SkeletonStatus>
);

export const AnalyticsTableSkeleton = ({
  label,
  chips,
  columns,
}: {
  label: string;
  chips: number;
  columns: number;
}) => (
  <SkeletonStatus label={label} className="space-y-4 pb-10">
    <StatChipsSkeleton count={chips} />
    <TableSkeleton columns={columns} rows={8} />
  </SkeletonStatus>
);
