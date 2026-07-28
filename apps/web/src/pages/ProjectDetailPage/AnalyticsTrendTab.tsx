import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useRunTrend } from '@/hooks/useAnalytics';
import { useRequiredParam } from '@/hooks/useRequiredParam';
import { formatDate } from '@/lib/format';

const PALETTE = [
  '#818cf8',
  '#36d399',
  '#f97316',
  '#f43f5e',
  '#facc15',
  '#22d3ee',
  '#a78bfa',
];

const MANUAL_COLOR = '#94a3b8';

const sourceLabel = (source: string | undefined) =>
  source ? source.charAt(0).toUpperCase() + source.slice(1) : 'Manual';

const sourceColor = (source: string | undefined, index: number) =>
  source ? (PALETTE[index % PALETTE.length] ?? PALETTE[0]) : MANUAL_COLOR;

const gradientId = (source: string | undefined) =>
  `trendGrad-${source ?? 'manual'}`;

const passRateClass = (rate: number) => {
  if (rate >= 80) return 'text-success';
  if (rate >= 50) return 'text-warning';
  return 'text-error';
};

const deltaClass = (delta: number) => {
  if (delta > 0) return 'text-success';
  if (delta < 0) return 'text-error';
  return 'text-base-content/65';
};

const deltaLabel = (delta: number | null) => {
  if (delta === null) return 'Not enough data';
  if (delta > 0) return 'Improving';
  if (delta < 0) return 'Declining';
  return 'Unchanged';
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
  const entry = payload[0].payload;
  return (
    <div className="min-w-48 rounded-xl border border-border bg-base-100 px-3.5 py-2.5 text-sm shadow-xl">
      <p className="mb-0.5 max-w-52 truncate font-semibold">{entry.fullName}</p>
      <p className="mb-2 text-xs text-base-content/65">{entry.date}</p>
      <div className="flex items-center justify-between gap-8">
        <span className="text-xs text-base-content/85">Pass rate</span>
        <span
          className={`font-bold tabular-nums ${passRateClass(entry.passRate)}`}
        >
          {entry.passRate}%
        </span>
      </div>
      <div className="my-1.5 border-t border-border/50" />
      {(
        [
          { label: 'Passed', value: entry.passed, cls: 'bg-success' },
          { label: 'Failed', value: entry.failed, cls: 'bg-error' },
          { label: 'Blocked', value: entry.blocked, cls: 'bg-warning' },
          { label: 'Skipped', value: entry.skipped, cls: 'bg-base-content/30' },
        ] as const
      ).map(({ label, value, cls }) => (
        <div key={label} className="flex items-center justify-between gap-8">
          <span className="flex items-center gap-1.5 text-xs text-base-content/85">
            <span className={`inline-block size-1.5 rounded-full ${cls}`} />
            {label}
          </span>
          <span className="text-xs tabular-nums">{value}</span>
        </div>
      ))}
      <div className="mt-1.5 flex items-center justify-between border-t border-border/50 pt-1.5">
        <span className="text-xs text-base-content/65">Total</span>
        <span className="text-xs font-medium tabular-nums">{entry.total}</span>
      </div>
    </div>
  );
};

const truncate = (text: string, maxLength: number) =>
  text.length > maxLength ? text.slice(0, maxLength) + '…' : text;

type SourceGroup = {
  source: string | undefined;
  data: TrendEntry[];
  index: number;
};

const TrendSection = ({ group }: { group: SourceGroup }) => {
  const color = sourceColor(group.source, group.index);
  const label = sourceLabel(group.source);
  const gradId = gradientId(group.source);
  const data = group.data;

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const latest = data.at(-1)!;
    const previousPoint = data.length > 1 ? data.at(-2)! : null;
    const delta =
      previousPoint === null ? null : latest.passRate - previousPoint.passRate;
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-base-100 px-4 py-3">
          <p className="text-xs text-base-content/75">Latest Pass Rate</p>
          <p
            className={`mt-1 text-2xl font-bold tabular-nums ${passRateClass(stats.latest.passRate)}`}
          >
            {stats.latest.passRate}%
          </p>
          <p className="mt-0.5 truncate text-xs text-base-content/65">
            {stats.latest.fullName}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-base-100 px-4 py-3">
          <p className="text-xs text-base-content/75">vs. Previous Run</p>
          {stats.delta === null ? (
            <p className="mt-1 text-2xl font-bold text-base-content/55">—</p>
          ) : (
            <p
              className={`mt-1 text-2xl font-bold tabular-nums ${deltaClass(stats.delta)}`}
            >
              {stats.delta > 0 ? '+' : ''}
              {stats.delta}%
            </p>
          )}
          <p className="mt-0.5 text-xs text-base-content/65">
            {deltaLabel(stats.delta)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-base-100 px-4 py-3">
          <p className="text-xs text-base-content/75">Average Pass Rate</p>
          <p
            className={`mt-1 text-2xl font-bold tabular-nums ${passRateClass(stats.avg)}`}
          >
            {stats.avg}%
          </p>
          <p className="mt-0.5 text-xs text-base-content/65">
            across {stats.count} run{stats.count === 1 ? '' : 's'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-base-100 px-4 py-3">
          <p className="text-xs text-base-content/75">Best Run</p>
          <p className="mt-1 text-2xl font-bold text-success tabular-nums">
            {stats.best.passRate}%
          </p>
          <p className="mt-0.5 truncate text-xs text-base-content/65">
            {stats.best.fullName}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-base-100 px-4 pt-4 pb-2">
        <p className="mb-4 text-xs font-semibold tracking-widest text-base-content/65 uppercase">
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
              tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.4 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              unit="%"
              tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.4 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              content={<TrendTooltip />}
              cursor={{ fill: 'currentColor', fillOpacity: 0.03 }}
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
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const AnalyticsTrendTab = () => {
  const projectId = useRequiredParam('projectId');
  const { data: trend } = useRunTrend(projectId, 20);

  const groups = useMemo(() => {
    const raw = [...(trend ?? [])].toReversed();
    const map = new Map<string, TrendEntry[]>();

    for (const point of raw) {
      const key = point.source ?? '__manual__';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        name: truncate(point.runName, 18),
        fullName: point.runName,
        date: formatDate(point.createdAt),
        passRate: point.passRate,
        passed: point.passed,
        failed: point.failed,
        blocked: point.blocked,
        skipped: point.skipped,
        total: point.total,
      });
    }

    const sorted = [...map].toSorted((groupA, groupB) => {
      if (groupA[0] === '__manual__') return 1;
      if (groupB[0] === '__manual__') return -1;
      return groupA[0].localeCompare(groupB[0]);
    });

    return sorted.map(([key, data], index) => ({
      source: key === '__manual__' ? undefined : key,
      data,
      index,
    }));
  }, [trend]);

  if (groups.length === 0)
    return (
      <p className="py-10 text-center text-sm text-base-content/65">
        No run data yet. Complete a test run to see trend data.
      </p>
    );

  return (
    <div className="space-y-8 pb-10">
      {groups.map((group) => (
        <TrendSection key={group.source ?? '__manual__'} group={group} />
      ))}
    </div>
  );
};
