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

import {
  deltaClass,
  deltaLabel,
  gradientId,
  sourceColor,
  type SourceGroup,
  sourceLabel,
} from "@/features/analytics/trendHelpers";
import { TrendTooltip } from "@/features/analytics/TrendTooltip";
import { cn } from "@/lib/cn";
import { passRateClass } from "@/lib/format";

interface StatTileProps {
  label: string;
  value: string;
  valueClassName: string;
  footnote: string;
}

const StatTile = ({
  label,
  value,
  valueClassName,
  footnote,
}: StatTileProps) => (
  <div className="panel px-4 py-3">
    <p className="text-xs text-fg-secondary">{label}</p>
    <p className={cn("mt-1 text-2xl font-bold tabular-nums", valueClassName)}>
      {value}
    </p>
    <p className="mt-0.5 truncate text-xs text-fg-muted" title={footnote}>
      {footnote}
    </p>
  </div>
);

const formatDelta = (delta: number | null) => {
  if (delta === null) return "—";
  return `${delta > 0 ? "+" : ""}${delta}%`;
};

export const TrendSection = ({ group }: { group: SourceGroup }) => {
  const color = sourceColor(group.source, group.index);
  const label = sourceLabel(group.source);
  const gradId = gradientId(group.source);
  const data = group.data;

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const latest = data.at(-1)!;
    const previousPoint = data.length > 1 ? data.at(-2)! : null;
    const delta =
      previousPoint === null
        ? null
        : Math.round((latest.passRate - previousPoint.passRate) * 10) / 10;
    let sum = 0;
    for (const point of data) sum += point.passRate;
    const avg = Math.round(sum / data.length);
    let best = latest;
    for (const point of data) {
      if (point.passRate > best.passRate) best = point;
    }
    return { latest, delta, avg, best, count: data.length };
  }, [data]);

  if (!stats) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="inline-block size-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h3 className="text-sm font-semibold">{label}</h3>
      </div>

      {stats.count < 2 ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          <StatTile
            label="Latest Pass Rate"
            value={stats.latest.passRate + "%"}
            valueClassName={passRateClass(stats.latest.passRate)}
            footnote={stats.latest.fullName}
          />
          <p className="flex items-center rounded-xl border border-dashed border-border px-4 py-3 text-sm text-fg-muted">
            The trend chart appears once this source has two or more completed
            runs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Latest Pass Rate"
            value={stats.latest.passRate + "%"}
            valueClassName={passRateClass(stats.latest.passRate)}
            footnote={stats.latest.fullName}
          />
          <StatTile
            label="vs. Previous Run"
            value={formatDelta(stats.delta)}
            valueClassName={
              stats.delta === null ? "text-fg-subtle" : deltaClass(stats.delta)
            }
            footnote={deltaLabel(stats.delta)}
          />
          <StatTile
            label="Average Pass Rate"
            value={stats.avg + "%"}
            valueClassName={passRateClass(stats.avg)}
            footnote={`across ${stats.count} runs`}
          />
          <StatTile
            label="Best Run"
            value={stats.best.passRate + "%"}
            valueClassName="text-success"
            footnote={stats.best.fullName}
          />
        </div>
      )}

      {stats.count >= 2 && (
        <div className="panel px-4 pt-4 pb-2">
          <p className="mb-4 text-xs font-semibold tracking-widest text-fg-muted uppercase">
            Pass Rate Over Time
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
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
                tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
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
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                activeDot={{
                  r: 5,
                  fill: color,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
