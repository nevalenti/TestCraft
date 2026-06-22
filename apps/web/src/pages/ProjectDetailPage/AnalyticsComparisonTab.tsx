import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { useRunComparison } from "@/hooks/useAnalytics";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import { useTestRuns } from "@/hooks/useTestRuns";

const STATUS_BADGE: Record<string, string> = {
  Passed: "badge-success",
  Failed: "badge-error",
  Blocked: "badge-warning",
  Skipped: "badge-ghost",
};

const rowBg = (isRegression: boolean, isFix: boolean) => {
  if (isRegression) return "bg-error/5";
  if (isFix) return "bg-success/5";
  return "";
};

type Filter = "all" | "changes";

export const AnalyticsComparisonTab = () => {
  const projectId = useRequiredParam("projectId");
  const { data: runs } = useTestRuns(projectId);
  const [runA, setRunA] = useState("");
  const [runB, setRunB] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const { data: comparison } = useRunComparison(
    projectId,
    submitted ? runA : "",
    submitted ? runB : "",
  );

  const counts = useMemo(() => {
    if (!comparison) return null;
    const regressions = comparison.results.filter((r) => r.isRegression).length;
    const fixes = comparison.results.filter((r) => r.isFix).length;
    return {
      regressions,
      fixes,
      unchanged: comparison.results.length - regressions - fixes,
    };
  }, [comparison]);

  const visibleRows = useMemo(() => {
    if (!comparison) return [];
    if (filter === "changes")
      return comparison.results.filter((r) => r.isRegression || r.isFix);
    return comparison.results;
  }, [comparison, filter]);

  const canCompare = runA && runB && runA !== runB;

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-36 flex-1">
          <label
            htmlFor="run-a"
            className="mb-1 block text-xs font-medium text-base-content/50"
          >
            Run A
          </label>
          <select
            id="run-a"
            className="select-bordered select w-full select-sm"
            value={runA}
            onChange={(e) => {
              setRunA(e.target.value);
              setSubmitted(false);
            }}
          >
            <option value="">Select…</option>
            {(runs ?? []).map((r) => (
              <option key={r.id} value={r.id} disabled={r.id === runB}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <span className="pb-1.5 text-xs font-semibold text-base-content/30 select-none">
          VS
        </span>

        <div className="min-w-36 flex-1">
          <label
            htmlFor="run-b"
            className="mb-1 block text-xs font-medium text-base-content/50"
          >
            Run B
          </label>
          <select
            id="run-b"
            className="select-bordered select w-full select-sm"
            value={runB}
            onChange={(e) => {
              setRunB(e.target.value);
              setSubmitted(false);
            }}
          >
            <option value="">Select…</option>
            {(runs ?? []).map((r) => (
              <option key={r.id} value={r.id} disabled={r.id === runA}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn shrink-0 btn-sm btn-primary"
          disabled={!canCompare}
          onClick={() => {
            setFilter("all");
            setSubmitted(true);
          }}
        >
          <ArrowsRightLeftIcon className="size-3.5" />
          Compare
        </button>
      </div>

      {!submitted && (
        <EmptyState
          icon={<ArrowsRightLeftIcon className="size-6" />}
          title="Select two runs to compare"
          description="Choose Run A and Run B above, then click Compare to see regressions and fixes."
        />
      )}

      {submitted && comparison && counts && (
        <>
          {/* Summary strip */}
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
              <span className="text-lg font-bold text-base-content/60 tabular-nums">
                {counts.unchanged}
              </span>
              <span className="text-xs font-medium text-base-content/40">
                Unchanged
              </span>
            </div>

            {/* Filter toggle */}
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
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    filter === key
                      ? "bg-base-100 text-base-content shadow-sm"
                      : "text-base-content/50 hover:text-base-content"
                  }`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {visibleRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-base-content/40">
              No changes between these two runs.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="table table-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-base-content/50">
                    <th className="font-medium">Test Case</th>
                    <th className="font-medium">{comparison.runAName}</th>
                    <th className="font-medium">{comparison.runBName}</th>
                    <th className="font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr
                      key={row.testCaseId}
                      className={`hover:bg-base-200/40 ${rowBg(row.isRegression, row.isFix)}`}
                    >
                      <td className="max-w-xs truncate text-sm font-medium">
                        {row.testCaseName}
                      </td>
                      <td>
                        {row.statusInA ? (
                          <span
                            className={`badge badge-sm ${STATUS_BADGE[row.statusInA] ?? "badge-ghost"}`}
                          >
                            {row.statusInA}
                          </span>
                        ) : (
                          <span className="text-sm text-base-content/30">
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        {row.statusInB ? (
                          <span
                            className={`badge badge-sm ${STATUS_BADGE[row.statusInB] ?? "badge-ghost"}`}
                          >
                            {row.statusInB}
                          </span>
                        ) : (
                          <span className="text-sm text-base-content/30">
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        {row.isRegression && (
                          <span className="badge gap-1 badge-sm badge-error">
                            ↓ Regression
                          </span>
                        )}
                        {row.isFix && (
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
          )}
        </>
      )}
    </div>
  );
};
