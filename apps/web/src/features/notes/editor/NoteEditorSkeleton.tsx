import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { SkeletonStatus } from "@/components/ui/skeleton/SkeletonStatus";
import { cn } from "@/lib/cn";

const LINES = [
  "w-2/5",
  "w-0",
  "w-11/12",
  "w-4/5",
  "w-5/6",
  "w-1/2",
  "w-0",
  "w-1/3",
  "w-3/4",
  "w-2/3",
];

export const NoteEditorSkeleton = () => (
  <SkeletonStatus
    label="Loading note…"
    className="flex min-h-0 flex-1 flex-col"
  >
    <div className="flex flex-col gap-2 border-b border-border px-3 pt-3 pb-2.5 lg:px-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <Skeleton className="hidden size-8 rounded-lg md:block" />
        <Skeleton className="mx-2 h-8 w-64 max-w-[60%] rounded-lg" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </div>
    </div>

    <div className="flex min-h-80 flex-1 flex-col gap-3 px-6 py-5 lg:px-10">
      {LINES.map((width, i) => (
        <div key={i} className="flex h-4 items-center gap-4">
          <Skeleton className="h-2.5 w-4 shrink-0 opacity-60" />
          {width !== "w-0" && <Skeleton className={cn("h-3", width)} />}
        </div>
      ))}
    </div>

    <div className="flex h-8 shrink-0 items-center gap-4 border-t border-border px-3 lg:px-5">
      <Skeleton className="h-2.5 w-16" />
      <Skeleton className="h-2.5 w-12" />
    </div>
  </SkeletonStatus>
);
