import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useFlakyTests,
  useRunComparison,
  useRunTrend,
  useSuiteBreakdown,
} from "@/hooks/useAnalytics";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import { useTestRuns } from "@/hooks/useTestRuns";
import { formatDate } from "@/lib/format";

const COLORS = {
  passed: "#36d399",
  failed: "#f87272",
  blocked: "#fbbd23",
  skipped: "#94a3b8",
};

const STATUS_BADGE: Record<string, string> = {
  Passed: "badge-success",
  Failed: "badge-error",
  Blocked: "badge-warning",
  Skipped: "badge-ghost",
};

type TrendPayloadEntry = {
  fullName: string;
  passRate: number;
  passed: number;
  failed: number;
  total: number;
};

const TrendTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TrendPayloadEntry }[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="min-w-44 rounded-xl border border-border bg-base-100 px-3.5 py-2.5 text-sm shadow-xl">
      <p className="mb-2 max-w-48 truncate font-semibold">{d.fullName}</p>
      <div className="flex items-center justify-between gap-6">
        <span className="text-xs text-base-content/60">Pass rate</span>
        <span className="font-bold text-success tabular-nums">
          {d.passRate}%
        </span>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="flex items-center gap-1.5 text-xs text-base-content/60">
          <span className="inline-block size-2 rounded-full bg-success" />
          Passed
        </span>
        <span className="text-xs font-medium tabular-nums">{d.passed}</span>
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="flex items-center gap-1.5 text-xs text-base-content/60">
          <span className="inline-block size-2 rounded-full bg-error" />
          Failed
        </span>
        <span className="text-xs font-medium tabular-nums">{d.failed}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5">
        <span className="text-xs text-base-content/50">Total</span>
        <span className="text-xs tabular-nums">{d.total}</span>
      </div>
    </div>
  );
};

type SuiteEntry = { name: string; value: number; fill: string };

const SuiteTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: SuiteEntry[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, e) => s + (e.value ?? 0), 0);
  return (
    <div className="min-w-40 rounded-xl border border-border bg-base-100 px-3.5 py-2.5 text-sm shadow-xl">
      <p className="mb-2 max-w-52 truncate font-semibold">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-6"
        >
          <span className="flex items-center gap-1.5 text-xs text-base-content/60">
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: entry.fill }}
            />
            {entry.name}
          </span>
          <span className="text-xs font-medium tabular-nums">
            {entry.value}
          </span>
        </div>
      ))}
      <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5">
        <span className="text-xs text-base-content/50">Total</span>
        <span className="text-xs font-bold tabular-nums">{total}</span>
      </div>
    </div>
  );
};

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n) + "…" : s;

const getComparisonRowClass = (isRegression: boolean, isFix: boolean) => {
  if (isRegression) return "bg-error/5";
  if (isFix) return "bg-success/5";
  return "";
};

export const AnalyticsTab = () => {
  const projectId = useRequiredParam("projectId");
  const { data: runs } = useTestRuns(projectId);
  const { data: trend } = useRunTrend(projectId, 20);
  const { data: flakyTests } = useFlakyTests(projectId);

  const [suiteRunId, setSuiteRunId] = useState("");
  const [compareRunA, setCompareRunA] = useState("");
  const [compareRunB, setCompareRunB] = useState("");
  const [showComparison, setShowComparison] = useState(false);

  const { data: suiteBreakdown } = useSuiteBreakdown(projectId, suiteRunId);
  const { data: comparison } = useRunComparison(
    projectId,
    showComparison ? compareRunA : "",
    showComparison ? compareRunB : "",
  );

  const trendData = useMemo(
    () =>
      [...(trend ?? [])].toReversed().map((p) => ({
        name: truncate(p.runName, 18),
        fullName: p.runName,
        passRate: p.passRate,
        passed: p.passed,
        failed: p.failed,
        total: p.total,
      })),
    [trend],
  );

  const suiteData = useMemo(
    () =>
      (suiteBreakdown ?? []).map((s) => ({
        ...s,
        suiteName: truncate(s.suiteName, 14),
        suiteNameFull: s.suiteName,
      })),
    [suiteBreakdown],
  );

  const sortedFlakyTests = useMemo(
    () => [...(flakyTests ?? [])].toSorted((a, b) => b.flakRate - a.flakRate),
    [flakyTests],
  );

  return (
    <div className="space-y-10 py-2">
      {/* Pass Rate Trend */}
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-widest text-base-content/50 uppercase">
          Pass Rate Trend
        </h2>
        {trendData.length === 0 ? (
          <p className="text-sm text-base-content/40">No run data yet.</p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient
                    id="trendGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={COLORS.passed}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.passed}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                  tickLine={false}
                  axisLine={false}
                  width={38}
                />
                <Tooltip
                  content={<TrendTooltip />}
                  cursor={{ stroke: "rgba(0,0,0,0.08)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="passRate"
                  name="Pass Rate"
                  stroke={COLORS.passed}
                  strokeWidth={2.5}
                  fill="url(#trendGradient)"
                  dot={{ r: 3, fill: COLORS.passed, strokeWidth: 0 }}
                  activeDot={{
                    r: 5,
                    fill: COLORS.passed,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Flaky Tests */}
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-widest text-base-content/50 uppercase">
          Flaky Tests
        </h2>
        {flakyTests?.length ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="table table-sm">
              <thead>
                <tr className="border-b border-border text-xs text-base-content/50">
                  <th className="font-medium">Test Case</th>
                  <th className="text-right font-medium">Runs</th>
                  <th className="text-right font-medium">Passed</th>
                  <th className="text-right font-medium">Failed</th>
                  <th className="text-right font-medium">Flak Rate</th>
                </tr>
              </thead>
              <tbody>
                {sortedFlakyTests.map((stat) => {
                  const pct = Math.round(stat.flakRate * 100);
                  let barColor = "bg-info";
                  if (pct >= 60) barColor = "bg-error";
                  else if (pct >= 30) barColor = "bg-warning";
                  return (
                    <tr key={stat.testCaseId} className="hover:bg-base-200/40">
                      <td className="max-w-xs truncate text-sm font-medium">
                        {stat.testCaseName}
                      </td>
                      <td className="text-right text-sm text-base-content/60 tabular-nums">
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
        ) : (
          <p className="text-sm text-base-content/40">
            No flaky tests detected.
          </p>
        )}
      </section>

      {/* Suite Breakdown */}
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-widest text-base-content/50 uppercase">
          Suite Breakdown
        </h2>
        <div className="mb-4">
          <select
            className="select-bordered select select-sm"
            value={suiteRunId}
            onChange={(e) => setSuiteRunId(e.target.value)}
          >
            <option value="">Select a run…</option>
            {(runs ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({formatDate(r.createdAt)})
              </option>
            ))}
          </select>
        </div>
        {suiteRunId && suiteData.length > 0 && (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={suiteData}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(0,0,0,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="suiteName"
                  tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  content={<SuiteTooltip />}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Bar
                  dataKey="passed"
                  name="Passed"
                  stackId="a"
                  fill={COLORS.passed}
                />
                <Bar
                  dataKey="failed"
                  name="Failed"
                  stackId="a"
                  fill={COLORS.failed}
                />
                <Bar
                  dataKey="blocked"
                  name="Blocked"
                  stackId="a"
                  fill={COLORS.blocked}
                />
                <Bar
                  dataKey="skipped"
                  name="Skipped"
                  stackId="a"
                  fill={COLORS.skipped}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Run Comparison */}
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-widest text-base-content/50 uppercase">
          Run Comparison
        </h2>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="compare-run-a" className="label-text label text-xs">
              Run A
            </label>
            <select
              id="compare-run-a"
              className="select-bordered select select-sm"
              value={compareRunA}
              onChange={(e) => {
                setCompareRunA(e.target.value);
                setShowComparison(false);
              }}
            >
              <option value="">Select…</option>
              {(runs ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="compare-run-b" className="label-text label text-xs">
              Run B
            </label>
            <select
              id="compare-run-b"
              className="select-bordered select select-sm"
              value={compareRunB}
              onChange={(e) => {
                setCompareRunB(e.target.value);
                setShowComparison(false);
              }}
            >
              <option value="">Select…</option>
              {(runs ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-sm btn-primary"
            disabled={
              !compareRunA || !compareRunB || compareRunA === compareRunB
            }
            onClick={() => setShowComparison(true)}
          >
            Compare
          </button>
        </div>
        {showComparison && comparison && (
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
                {comparison.results.map((row) => (
                  <tr
                    key={row.testCaseId}
                    className={`hover:bg-base-200/40 ${getComparisonRowClass(row.isRegression, row.isFix)}`}
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
                        <span className="text-sm text-base-content/30">—</span>
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
                        <span className="text-sm text-base-content/30">—</span>
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
      </section>
    </div>
  );
};
