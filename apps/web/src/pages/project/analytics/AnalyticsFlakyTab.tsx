import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { getRouteApi } from "@tanstack/react-router";
import { useMemo } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TablePager } from "@/components/ui/TablePager";
import { useFlakyTests } from "@/features/analytics/hooks";
import { usePagination } from "@/hooks/usePagination";
import { cn } from "@/lib/cn";
import { TABLE_PAGE_SIZE } from "@/lib/constants";

const routeApi = getRouteApi("/_app/projects/$projectId/analytics/flaky");

export const AnalyticsFlakyTab = () => {
  const { projectId } = routeApi.useParams();
  const {
    data: flakyTests,
    isPending,
    isError,
    error,
    refetch,
  } = useFlakyTests(projectId);

  const sortedTests = useMemo(
    () =>
      [...(flakyTests ?? [])].toSorted(
        (testA, testB) => testB.flaky_rate - testA.flaky_rate,
      ),
    [flakyTests],
  );

  const {
    page: safePage,
    setPage,
    pageCount,
    pageItems: pageTests,
  } = usePagination(sortedTests);

  const severity = useMemo(
    () => ({
      high: sortedTests.filter((test) => test.flaky_rate >= 60).length,
      medium: sortedTests.filter(
        (test) => test.flaky_rate >= 30 && test.flaky_rate < 60,
      ).length,
      low: sortedTests.filter((test) => test.flaky_rate < 30).length,
    }),
    [sortedTests],
  );

  if (isPending) return <p role="status">Loading flaky tests…</p>;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  if (sortedTests.length === 0)
    return (
      <EmptyState
        icon={<ExclamationTriangleIcon className="size-6" />}
        title="No flaky tests detected"
        description="Tests that alternate between passing and failing across runs will appear here."
      />
    );

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-error/20 bg-error/8 px-3 py-2">
          <span className="text-lg font-bold text-error tabular-nums">
            {severity.high}
          </span>
          <div>
            <p className="text-xs font-semibold text-error/80">High Risk</p>
            <p className="text-xs text-fg-muted">≥ 60% flake rate</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/8 px-3 py-2">
          <span className="text-lg font-bold text-warning tabular-nums">
            {severity.medium}
          </span>
          <div>
            <p className="text-xs font-semibold text-warning/80">Medium Risk</p>
            <p className="text-xs text-fg-muted">30 – 59% flake rate</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-info/20 bg-info/8 px-3 py-2">
          <span className="text-lg font-bold text-info tabular-nums">
            {severity.low}
          </span>
          <div>
            <p className="text-xs font-semibold text-info/80">Low Risk</p>
            <p className="text-xs text-fg-muted">&lt; 30% flake rate</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="table table-stack table-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold tracking-wider text-fg-muted uppercase">
                <th className="w-8 text-center font-medium">#</th>
                <th className="font-medium">Test Case</th>
                <th className="text-right font-medium">Runs</th>
                <th className="text-right font-medium">Passed</th>
                <th className="text-right font-medium">Failed</th>
                <th className="text-right font-medium">Flake Rate</th>
              </tr>
            </thead>
            <tbody>
              {pageTests.map((stat, pageIndex) => {
                const index = safePage * TABLE_PAGE_SIZE + pageIndex;
                const pct = Math.round(stat.flaky_rate);
                let barColor = "bg-info";
                if (pct >= 60) barColor = "bg-error";
                else if (pct >= 30) barColor = "bg-warning";
                let rankColor = "text-info/60";
                if (pct >= 60) rankColor = "text-error/60";
                else if (pct >= 30) rankColor = "text-warning/60";
                return (
                  <tr key={stat.test_case_id} className="hover:bg-base-300/70">
                    <td
                      data-mobile-hide
                      className={cn(
                        "text-center text-xs font-bold tabular-nums",
                        rankColor,
                      )}
                    >
                      {index + 1}
                    </td>
                    <td data-primary className="max-w-xs">
                      <p className="truncate text-sm font-medium">
                        {stat.test_case_name}
                      </p>
                    </td>
                    <td className="text-right text-sm text-fg-secondary tabular-nums">
                      {stat.total_runs}
                    </td>
                    <td className="text-right text-sm font-medium text-success tabular-nums">
                      {stat.pass_count}
                    </td>
                    <td className="text-right text-sm font-medium text-error tabular-nums">
                      {stat.fail_count}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-base-300">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              barColor,
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-sm font-semibold tabular-nums">
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePager
          page={safePage}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};
