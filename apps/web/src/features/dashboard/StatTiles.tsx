import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/solid";
import type { DashboardSummary } from "@testcraft/types";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { passRateClass } from "@/lib/format";

interface StatTileProps {
  label: string;
  value: ReactNode;
  footnote: ReactNode;
}

const StatTile = ({ label, value, footnote }: StatTileProps) => (
  <div className="flex flex-col gap-1 panel p-4">
    <p className="text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">
      {label}
    </p>
    <p className="font-display text-2xl font-bold text-base-content tabular-nums">
      {value}
    </p>
    <p className="text-xs leading-snug text-fg-subtle">{footnote}</p>
  </div>
);

interface PassRateChangeProps {
  current: number;
  previous: number | null;
}

const PassRateChange = ({ current, previous }: PassRateChangeProps) => {
  if (previous === null) return <>No results the week before</>;
  const change = Math.round((current - previous) * 10) / 10;
  if (change === 0) return <>Same as the week before</>;
  const Icon = change > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

  return (
    <span className="inline-flex items-center gap-1">
      <Icon
        aria-hidden="true"
        className={cn("size-3.5", change > 0 ? "text-success" : "text-error")}
      />
      {change > 0 ? "Up" : "Down"} {Math.abs(change)} pts on the week before
    </span>
  );
};

export const StatTiles = ({ summary }: { summary: DashboardSummary }) => {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatTile
        label={`Pass rate · ${summary.window_days} days`}
        value={
          summary.pass_rate === null ? (
            "—"
          ) : (
            <span className={passRateClass(summary.pass_rate)}>
              {summary.pass_rate}%
            </span>
          )
        }
        footnote={
          summary.pass_rate === null ? (
            "No results this week"
          ) : (
            <PassRateChange
              current={summary.pass_rate}
              previous={summary.previous_pass_rate}
            />
          )
        }
      />
      <StatTile
        label="Failing tests"
        value={summary.failing_test_count}
        footnote="Latest result this week failed"
      />
      <StatTile
        label="Flaky tests"
        value={summary.flaky_test_count}
        footnote="Both pass and fail in recent runs"
      />
      <StatTile
        label="Active runs"
        value={summary.active_run_count}
        footnote="In progress right now"
      />
    </div>
  );
};
