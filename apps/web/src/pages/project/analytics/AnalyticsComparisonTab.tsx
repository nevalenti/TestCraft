import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { getRouteApi } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TablePager } from "@/components/ui/TablePager";
import { rowBg, STATUS_BADGE } from "@/features/analytics/comparisonHelpers";
import { useRunComparison } from "@/features/analytics/hooks";
import { latestRuns } from "@/features/analytics/latestRuns";
import { RunComparisonPicker } from "@/features/analytics/RunComparisonPicker";
import { useTestRuns } from "@/features/testRuns/hooks";
import { usePagination } from "@/hooks/usePagination";
import { cn } from "@/lib/cn";

const routeApi = getRouteApi("/_app/projects/$projectId/analytics/comparison");

type Filter = "all" | "changes";

export const AnalyticsComparisonTab = () => {
  const { projectId } = routeApi.useParams();
  const {
    data: runs,
    isError: isRunsError,
    error: runsError,
    refetch: refetchRuns,
  } = useTestRuns(projectId);
  const [runA, setRunA] = useState("");
  const [runB, setRunB] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [hasDefaulted, setHasDefaulted] = useState(false);

  if (!hasDefaulted && runs) {
    setHasDefaulted(true);
    const [newest, previous] = latestRuns(runs);
    if (newest && previous) {
      setRunA(previous.id);
      setRunB(newest.id);
      setSubmitted(true);
    }
  }

  const {
    data: comparison,
    isPending: isComparisonPending,
    isError: isComparisonError,
    error: comparisonError,
    refetch: refetchComparison,
  } = useRunComparison(projectId, submitted ? runA : "", submitted ? runB : "");

  const counts = useMemo(() => {
    if (!comparison) return null;
    const regressions = comparison.results.filter(
      (result) => result.is_regression,
    ).length;
    const fixes = comparison.results.filter((result) => result.is_fix).length;
    return {
      regressions,
      fixes,
      unchanged: comparison.results.length - regressions - fixes,
    };
  }, [comparison]);

  const visibleRows = useMemo(() => {
    if (!comparison) return [];
    if (filter === "changes")
      return comparison.results.filter(
        (result) => result.is_regression || result.is_fix,
      );
    return comparison.results;
  }, [comparison, filter]);

  const {
    page: safePage,
    setPage,
    pageCount,
    pageItems: pageRows,
  } = usePagination(visibleRows);

  if (isRunsError)
    return <ErrorState error={runsError} onRetry={refetchRuns} />;

  const canCompare = !!runA && !!runB && runA !== runB;

  return (
    <div className="space-y-4 pb-10">
      <RunComparisonPicker
        runs={runs}
        runA={runA}
        runB={runB}
        canCompare={canCompare}
        onChangeRunA={(id) => {
          setRunA(id);
          setSubmitted(false);
        }}
        onChangeRunB={(id) => {
          setRunB(id);
          setSubmitted(false);
        }}
        onCompare={() => {
          setFilter("all");
          setSubmitted(true);
          setPage(0);
        }}
      />

      {!submitted && (
        <EmptyState
          icon={<ArrowsRightLeftIcon className="size-6" />}
          title="Select two runs to compare"
          description="Choose Run A and Run B above, then click Compare to see regressions and fixes."
        />
      )}

      {submitted && isComparisonPending && <p role="status">Comparing runs…</p>}
      {submitted && isComparisonError && (
        <ErrorState error={comparisonError} onRetry={refetchComparison} />
      )}

      {submitted && comparison && counts && (
        <>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-error/20 bg-error/8 px-3 py-2">
              <span className="text-lg font-bold text-error tabular-nums">
                {counts.regressions}
              </span>
              <span className="text-xs font-medium text-error/70">
                Regression{counts.regressions === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/8 px-3 py-2">
              <span className="text-lg font-bold text-success tabular-nums">
                {counts.fixes}
              </span>
              <span className="text-xs font-medium text-success/70">Fixed</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-base-200/60 px-3 py-2">
              <span className="text-lg font-bold text-fg-secondary tabular-nums">
                {counts.unchanged}
              </span>
              <span className="text-xs font-medium text-fg-muted">
                Unchanged
              </span>
            </div>

            <div className="ml-auto flex items-center gap-0.5 rounded-lg bg-base-200 p-0.5">
              {(
                [
                  { key: "all", label: `All (${comparison.results.length})` },
                  {
                    key: "changes",
                    label: `Changes only (${counts.regressions + counts.fixes})`,
                  },
                ] as { key: Filter; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    filter === key
                      ? "bg-base-100 text-base-content shadow-sm"
                      : "text-fg-secondary hover:text-base-content",
                  )}
                  onClick={() => {
                    setFilter(key);
                    setPage(0);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {visibleRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">
              No changes between these two runs.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="table table-stack table-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold tracking-wider text-fg-muted uppercase">
                      <th className="font-medium">Test Case</th>
                      <th className="font-medium">{comparison.run_a_name}</th>
                      <th className="font-medium">{comparison.run_b_name}</th>
                      <th className="font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr
                        key={row.test_case_id}
                        className={cn(
                          "hover:bg-base-300/70",
                          rowBg(row.is_regression, row.is_fix),
                        )}
                      >
                        <td className="max-w-xs truncate text-sm font-medium">
                          {row.test_case_name}
                        </td>
                        <td>
                          {row.status_in_a ? (
                            <span
                              className={cn(
                                "badge badge-sm",
                                STATUS_BADGE[row.status_in_a] ?? "badge-ghost",
                              )}
                            >
                              {row.status_in_a}
                            </span>
                          ) : (
                            <span className="text-sm text-fg-subtle">—</span>
                          )}
                        </td>
                        <td>
                          {row.status_in_b ? (
                            <span
                              className={cn(
                                "badge badge-sm",
                                STATUS_BADGE[row.status_in_b] ?? "badge-ghost",
                              )}
                            >
                              {row.status_in_b}
                            </span>
                          ) : (
                            <span className="text-sm text-fg-subtle">—</span>
                          )}
                        </td>
                        <td>
                          {row.is_regression && (
                            <span className="badge gap-1 badge-sm badge-error">
                              ↓ Regression
                            </span>
                          )}
                          {row.is_fix && (
                            <span className="badge gap-1 badge-sm badge-success">
                              ↑ Fixed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePager
                page={safePage}
                pageCount={pageCount}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
