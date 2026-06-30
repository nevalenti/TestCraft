import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useRunTrend } from "@/hooks/useAnalytics";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import { formatDate } from "@/lib/format";

const PASSED_COLOR = "#36d399";

const passRateClass = (rate: number) => {
  if (rate >= 80) return "text-success";
  if (rate >= 50) return "text-warning";
  return "text-error";
};

const deltaClass = (delta: number) => {
  if (delta > 0) return "text-success";
  if (delta < 0) return "text-error";
  return "text-base-content/50";
};

const deltaLabel = (delta: number | null) => {
  if (delta === null) return "Not enough data";
  if (delta > 0) return "Improving";
  if (delta < 0) return "Declining";
  return "Unchanged";
};

type TrendEntry = {
  name: string;
  fullName: string;
  date: string;
  passRate: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  total: number;
};

const TrendTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TrendEntry }[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="min-w-48 rounded-xl border border-border bg-base-100 px-3.5 py-2.5 text-sm shadow-xl">
      <p className="mb-0.5 max-w-52 truncate font-semibold">{d.fullName}</p>
      <p className="mb-2 text-xs text-base-content/50">{d.date}</p>
      <div className="flex items-center justify-between gap-8">
        <span className="text-xs text-base-content/70">Pass rate</span>
        <span className={`font-bold tabular-nums ${passRateClass(d.passRate)}`}>
          {d.passRate}%
        </span>
      </div>
      <div className="my-1.5 border-t border-border/50" />
      {(
        [
          { label: "Passed", value: d.passed, cls: "bg-success" },
          { label: "Failed", value: d.failed, cls: "bg-error" },
          { label: "Blocked", value: d.blocked, cls: "bg-warning" },
          { label: "Skipped", value: d.skipped, cls: "bg-base-content/30" },
        ] as const
      ).map(({ label, value, cls }) => (
        <div key={label} className="flex items-center justify-between gap-8">
          <span className="flex items-center gap-1.5 text-xs text-base-content/70">
            <span className={`inline-block size-1.5 rounded-full ${cls}`} />
            {label}
          </span>
          <span className="text-xs tabular-nums">{value}</span>
        </div>
      ))}
      <div className="mt-1.5 flex items-center justify-between border-t border-border/50 pt-1.5">
        <span className="text-xs text-base-content/50">Total</span>
        <span className="text-xs font-medium tabular-nums">{d.total}</span>
      </div>
    </div>
  );
};

const truncate = (s: string, n: number) =>
  s.length > n ? s.slice(0, n) + "…" : s;

export const AnalyticsTrendTab = () => {
  const projectId = useRequiredParam("projectId");
  const { data: trend } = useRunTrend(projectId, 20);

  const trendData = useMemo(
    () =>
      [...(trend ?? [])].toReversed().map((p) => ({
        name: truncate(p.runName, 18),
        fullName: p.runName,
        date: formatDate(p.createdAt),
        passRate: p.passRate,
        passed: p.passed,
        failed: p.failed,
        blocked: p.blocked,
        skipped: p.skipped,
        total: p.total,
      })),
    [trend],
  );

  const stats = useMemo(() => {
    if (trendData.length === 0) return null;
    const latest = trendData.at(-1)!;
    const prev = trendData.length > 1 ? trendData.at(-2)! : null;
    const delta = prev === null ? null : latest.passRate - prev.passRate;
    let sum = 0;
    for (const p of trendData) sum += p.passRate;
    const avg = Math.round(sum / trendData.length);
    let best = latest;
    for (const p of trendData) {
      if (p.passRate > best.passRate) best = p;
    }
    return { latest, delta, avg, best, count: trendData.length };
  }, [trendData]);

  if (!stats)
    return (
      <p className="py-10 text-center text-sm text-base-content/50">
        No run data yet. Complete a test run to see trend data.
      </p>
    );

  return (
    <div className="space-y-4 pb-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-base-100 px-4 py-3">
          <p className="text-xs text-base-content/60">Latest Pass Rate</p>
          <p
            className={`mt-1 text-2xl font-bold tabular-nums ${passRateClass(stats.latest.passRate)}`}
          >
            {stats.latest.passRate}%
          </p>
          <p className="mt-0.5 truncate text-xs text-base-content/50">
            {stats.latest.fullName}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-base-100 px-4 py-3">
          <p className="text-xs text-base-content/60">vs. Previous Run</p>
          {stats.delta === null ? (
            <p className="mt-1 text-2xl font-bold text-base-content/40">—</p>
          ) : (
            <p
              className={`mt-1 text-2xl font-bold tabular-nums ${deltaClass(stats.delta)}`}
            >
              {stats.delta > 0 ? "+" : ""}
              {stats.delta}%
            </p>
          )}
          <p className="mt-0.5 text-xs text-base-content/50">
            {deltaLabel(stats.delta)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-base-100 px-4 py-3">
          <p className="text-xs text-base-content/60">Average Pass Rate</p>
          <p
            className={`mt-1 text-2xl font-bold tabular-nums ${passRateClass(stats.avg)}`}
          >
            {stats.avg}%
          </p>
          <p className="mt-0.5 text-xs text-base-content/50">
            across {stats.count} run{stats.count === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-base-100 px-4 py-3">
          <p className="text-xs text-base-content/60">Best Run</p>
          <p className="mt-1 text-2xl font-bold text-success tabular-nums">
            {stats.best.passRate}%
          </p>
          <p className="mt-0.5 truncate text-xs text-base-content/50">
            {stats.best.fullName}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-base-100 px-4 pt-4 pb-2">
        <p className="mb-4 text-xs font-semibold tracking-widest text-base-content/50 uppercase">
          Pass Rate Over Time
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={trendData}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PASSED_COLOR} stopOpacity={0.18} />
                <stop offset="95%" stopColor={PASSED_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.06}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              unit="%"
              tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              content={<TrendTooltip />}
              cursor={{ fill: "currentColor", fillOpacity: 0.03 }}
            />
            <Area
              type="monotone"
              dataKey="passRate"
              name="Pass Rate"
              stroke={PASSED_COLOR}
              strokeWidth={2}
              fill="url(#trendGradient)"
              dot={{ r: 3, fill: PASSED_COLOR, strokeWidth: 0 }}
              activeDot={{
                r: 5,
                fill: PASSED_COLOR,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
