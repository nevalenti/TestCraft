import { useVirtualizer } from '@tanstack/react-virtual';
import { TestResultStatus, TestRunStatus } from '@testcraft/types';
import { useRef } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonStatus } from '@/components/ui/SkeletonStatus';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTestRun } from '@/features/testRuns/hooks';
import { useResultFeed } from '@/features/testRuns/useResultFeed';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { cn } from '@/lib/cn';
import { formatDate, formatDuration as formatDurationText } from '@/lib/format';

const LogRowSkeleton = () => (
  <div className="flex items-center gap-3 border-t border-l-4 border-t-border border-l-base-content/10 px-4 py-3 first:border-t-0">
    <Skeleton className="h-5 w-16 rounded-md" />
    <Skeleton className="h-3.5 flex-1" />
    <Skeleton className="h-3 w-10 shrink-0 rounded-md" />
    <Skeleton className="h-3 w-16 shrink-0" />
  </div>
);

const STATUS_BORDER: Record<TestResultStatus, string> = {
  [TestResultStatus.Passed]: 'border-l-success',
  [TestResultStatus.Failed]: 'border-l-error',
  [TestResultStatus.Blocked]: 'border-l-warning',
  [TestResultStatus.Skipped]: 'border-l-base-content/20',
};

const ROW_HEIGHT_ESTIMATE = 49;

const formatDuration = (ms: number | null | undefined) =>
  ms == null ? null : formatDurationText(ms);

interface Props {
  projectId: string;
  runId: string;
}

export const LiveLogFeed = ({ projectId, runId }: Props) => {
  const { items, isLoading } = useResultFeed(projectId, runId);
  const { data: run } = useTestRun(projectId, runId);
  const isActive = run?.status === TestRunStatus.Active;
  const showSkeleton = useIsLoadingVisible(isLoading);
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    getItemKey: (index) => items[index].id,
    overscan: 10,
  });

  return isLoading ? (
    showSkeleton && (
      <SkeletonStatus label="Loading log…">
        <div className="overflow-hidden rounded-xl border border-border bg-base-100">
          {Array.from({ length: 5 }, (_, i) => (
            <LogRowSkeleton key={i} />
          ))}
        </div>
      </SkeletonStatus>
    )
  ) : (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-3">
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            Live
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-base-content/12 bg-base-content/5 px-2.5 py-1 text-xs font-semibold text-base-content/65">
            Completed
          </span>
        )}
        <span className="text-sm text-base-content/65">
          {items.length} result{items.length === 1 ? '' : 's'}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-base-content/55">
          Waiting for results…
        </p>
      ) : (
        <div
          ref={scrollRef}
          className="min-h-0 overflow-y-auto rounded-xl border border-border bg-base-100"
        >
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const result = items[virtualRow.index];
              const duration = formatDuration(result.durationMs);
              return (
                <div
                  key={virtualRow.key}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  className={cn(
                    'absolute top-0 left-0 flex w-full items-center gap-3 border-l-4 px-4 py-3',
                    virtualRow.index > 0 && 'border-t border-t-border',
                    STATUS_BORDER[result.status],
                  )}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <StatusBadge status={result.status} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {result.testCaseName}
                  </span>
                  {duration && (
                    <span className="shrink-0 rounded-md bg-base-200 px-1.5 py-0.5 text-xs text-base-content/70 tabular-nums">
                      {duration}
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-base-content/55">
                    {formatDate(result.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
