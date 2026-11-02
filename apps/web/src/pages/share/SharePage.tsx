import { getRouteApi } from "@tanstack/react-router";
import type { TestResultStatus } from "@testcraft/types";
import { useState } from "react";

import { ResultStatusBadge } from "@/components/ui/ResultStatusBadge";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { SkeletonStatus } from "@/components/ui/skeleton/SkeletonStatus";
import { TableSkeleton } from "@/components/ui/skeleton/TableSkeleton";
import { TablePager } from "@/components/ui/TablePager";
import { useSharedRun } from "@/features/shareTokens/hooks";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";
import { cn } from "@/lib/cn";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  passRateClass,
} from "@/lib/format";

const routeApi = getRouteApi("/share/$token");

const SharePageSkeleton = () => (
  <SkeletonStatus label="Loading shared run…">
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-3 h-8 w-72" />
        <Skeleton className="mt-2 h-4 w-40" />
        <Skeleton className="mt-1.5 h-3 w-24" />

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-6">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-base-100 p-4 text-center"
            >
              <Skeleton className="mx-auto h-7 w-10" />
              <Skeleton className="mx-auto mt-1.5 h-3 w-14" />
            </div>
          ))}
        </div>

        <Skeleton className="mt-3 h-6 w-40" />

        <div className="mt-8">
          <TableSkeleton columns={6} rows={8} />
        </div>
      </div>
    </div>
  </SkeletonStatus>
);

export const SharePage = () => {
  const { token } = routeApi.useParams();
  const [page, setPage] = useState(0);
  const { data: run, isPending, isError } = useSharedRun(token, page);
  const showSkeleton = useIsLoadingVisible(isPending);

  if (isPending) return showSkeleton ? <SharePageSkeleton /> : null;

  if (isError || !run)
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-error">Link not found</h1>
          <p className="text-sm text-fg-secondary">
            This share link may have expired or been revoked.
          </p>
        </div>
      </div>
    );

  const pageCount = Math.max(1, Math.ceil(run.results_total / run.page_size));
  const firstRowNumber = (run.page - 1) * run.page_size + 1;

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-semibold tracking-widest text-fg-muted uppercase">
            Shared Test Run
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {run.run_name}
        </h1>
        {run.environment && (
          <p className="mt-1 text-sm text-fg-secondary">{run.environment}</p>
        )}
        <p className="mt-1 text-xs text-fg-muted">
          {formatDate(run.created_at)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-6">
          <Stat label="Total" value={run.total} />
          <Stat label="Passed" value={run.passed} className="text-success" />
          <Stat label="Failed" value={run.failed} className="text-error" />
          <Stat label="Blocked" value={run.blocked} className="text-warning" />
          <Stat
            label="Skipped"
            value={run.skipped}
            className="text-fg-secondary"
          />
          <Stat
            label="Untested"
            value={run.untested}
            className="text-fg-muted"
          />
        </div>
        <div className="mt-3">
          <span
            className={cn("text-xl font-bold", passRateClass(run.pass_rate))}
          >
            {run.pass_rate}%
          </span>
          <span className="ml-1.5 text-sm text-fg-secondary">pass rate</span>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-base-100">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-xs text-fg-secondary">
                  <th>#</th>
                  <th>Test Case</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Executed</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {run.results.map((result, index) => (
                  <tr
                    key={`${result.test_case_name}-${index}`}
                    className="hover:bg-base-200"
                  >
                    <td className="text-xs text-fg-muted tabular-nums">
                      {firstRowNumber + index}
                    </td>
                    <td className="text-sm font-medium">
                      {result.test_case_name}
                    </td>
                    <td>
                      <ResultStatusBadge
                        status={result.status as TestResultStatus}
                      />
                    </td>
                    <td className="text-xs text-fg-secondary tabular-nums">
                      {formatDuration(result.duration_ms)}
                    </td>
                    <td className="text-xs whitespace-nowrap text-fg-secondary tabular-nums">
                      {formatDateTime(result.executed_at)}
                    </td>
                    <td className="max-w-xs truncate text-xs text-fg-secondary">
                      {result.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePager
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>

        <p className="mt-8 text-center text-xs text-fg-subtle">
          Generated by TestCraft
        </p>
      </div>
    </div>
  );
};

interface StatProps {
  label: string;
  value: number;
  className?: string;
}

const Stat = ({ label, value, className }: StatProps) => (
  <div className="rounded-xl border border-border bg-base-100 p-4 text-center">
    <p className={cn("text-2xl font-bold tabular-nums", className)}>{value}</p>
    <p className="mt-0.5 text-xs text-fg-secondary">{label}</p>
  </div>
);
