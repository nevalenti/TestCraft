import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useMemo } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { useFlakyTests } from "@/hooks/useAnalytics";
import { useRequiredParam } from "@/hooks/useRequiredParam";

export const AnalyticsFlakyTab = () => {
  const projectId = useRequiredParam("projectId");
  const { data: flakyTests } = useFlakyTests(projectId);

  const sortedTests = useMemo(
    () =>
      [...(flakyTests ?? [])].toSorted(
        (testA, testB) => testB.flakRate - testA.flakRate,
      ),
    [flakyTests],
  );

  const severity = useMemo(
    () => ({
      high: sortedTests.filter((test) => test.flakRate >= 0.6).length,
      medium: sortedTests.filter(
        (test) => test.flakRate >= 0.3 && test.flakRate < 0.6,
      ).length,
      low: sortedTests.filter((test) => test.flakRate < 0.3).length,
    }),
    [sortedTests],
  );

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
            <p className="text-xs text-base-content/65">≥ 60% flak rate</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/8 px-3 py-2">
          <span className="text-lg font-bold text-warning tabular-nums">
            {severity.medium}
          </span>
          <div>
            <p className="text-xs font-semibold text-warning/80">Medium Risk</p>
            <p className="text-xs text-base-content/65">30 – 59% flak rate</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-info/20 bg-info/8 px-3 py-2">
          <span className="text-lg font-bold text-info tabular-nums">
            {severity.low}
          </span>
          <div>
            <p className="text-xs font-semibold text-info/80">Low Risk</p>
            <p className="text-xs text-base-content/65">&lt; 30% flak rate</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="table table-sm">
          <thead>
            <tr className="border-b border-border text-xs text-base-content/75">
              <th className="w-8 text-center font-medium">#</th>
              <th className="font-medium">Test Case</th>
              <th className="text-right font-medium">Runs</th>
              <th className="text-right font-medium">Passed</th>
              <th className="text-right font-medium">Failed</th>
              <th className="text-right font-medium">Flake Rate</th>
            </tr>
          </thead>
          <tbody>
            {sortedTests.map((stat, index) => {
              const pct = Math.round(stat.flakRate * 100);
              let barColor = "bg-info";
              if (pct >= 60) barColor = "bg-error";
              else if (pct >= 30) barColor = "bg-warning";
              let rankColor = "text-info/60";
              if (pct >= 60) rankColor = "text-error/60";
              else if (pct >= 30) rankColor = "text-warning/60";
              return (
                <tr key={stat.testCaseId} className="hover:bg-base-300/70">
                  <td
                    className={`text-center text-xs font-bold tabular-nums ${rankColor}`}
                  >
                    {index + 1}
                  </td>
                  <td className="max-w-xs">
                    <p className="truncate text-sm font-medium">
                      {stat.testCaseName}
                    </p>
                  </td>
                  <td className="text-right text-sm text-base-content/85 tabular-nums">
                    {stat.totalRuns}
                  </td>
                  <td className="text-right text-sm font-medium text-success tabular-nums">
                    {stat.passCount}
                  </td>
                  <td className="text-right text-sm font-medium text-error tabular-nums">
                    {stat.failCount}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-base-300">
                        <div
                          className={`h-full rounded-full transition-all ${barColor}`}
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
    </div>
  );
};
