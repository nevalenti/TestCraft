import { type TrendEntry } from '@/features/analytics/trendHelpers';
import { cn } from '@/lib/cn';
import { passRateClass } from '@/lib/format';

export const TrendTooltip = ({
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
          className={cn(
            'font-bold tabular-nums',
            passRateClass(entry.passRate),
          )}
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
            <span className={cn('inline-block size-1.5 rounded-full', cls)} />
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
