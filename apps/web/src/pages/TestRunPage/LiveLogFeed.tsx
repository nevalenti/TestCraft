import { TestResultStatus, TestRunStatus } from "@testcraft/types";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { useResultFeed } from "@/hooks/useResultFeed";
import { useTestRun } from "@/hooks/useTestRuns";
import { formatDate } from "@/lib/format";

const STATUS_BORDER: Record<TestResultStatus, string> = {
  [TestResultStatus.Passed]: "border-l-success",
  [TestResultStatus.Failed]: "border-l-error",
  [TestResultStatus.Blocked]: "border-l-warning",
  [TestResultStatus.Skipped]: "border-l-base-content/20",
};

const formatDuration = (ms: number | null | undefined) => {
  if (ms === undefined || ms === null) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

interface Props {
  projectId: string;
  runId: string;
}

export const LiveLogFeed = ({ projectId, runId }: Props) => {
  const { items, isLoading } = useResultFeed(projectId, runId);
  const { data: run } = useTestRun(projectId, runId);
  const isActive = run?.status === TestRunStatus.Active;

  return isLoading ? (
    <div className="flex min-h-80 items-center justify-center">
      <span className="loading loading-lg loading-spinner text-primary" />
    </div>
  ) : (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
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
          {items.length} result{items.length === 1 ? "" : "s"}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-base-content/55">
          Waiting for results…
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-base-100">
          {items.map((result) => {
            const duration = formatDuration(result.durationMs);
            return (
              <div
                key={result.id}
                className={`flex items-center gap-3 border-t border-l-4 border-t-border px-4 py-3 first:border-t-0 ${STATUS_BORDER[result.status]}`}
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
      )}
    </div>
  );
};
