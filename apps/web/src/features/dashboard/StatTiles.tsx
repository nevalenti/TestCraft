import {
  BoltIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import type { DashboardSummary } from "@testcraft/types";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { passRateClass } from "@/lib/format";

interface StatTileProps {
  label: string;
  value: ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: Tone;
}

type Tone = "success" | "warning" | "error" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-error/15 text-error",
  info: "bg-info/15 text-info",
};

const passRateTone = (rate: number): Tone => {
  if (rate >= 80) return "success";
  if (rate >= 50) return "warning";
  return "error";
};

const StatTile = ({ label, value, icon: Icon, tone }: StatTileProps) => (
  <div className="flex items-start justify-between gap-3 panel p-4">
    <div className="min-w-0">
      <p className="truncate text-2xs font-semibold tracking-wider text-fg-subtle uppercase">
        {label}
      </p>
      <p className="mt-2.5 font-display text-3xl leading-none font-bold text-base-content tabular-nums">
        {value}
      </p>
    </div>
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        tone ? TONE_CLASSES[tone] : "subtle-surface text-fg-subtle",
      )}
    >
      <Icon className="size-4" />
    </span>
  </div>
);

export const StatTiles = ({ summary }: { summary: DashboardSummary }) => {
  return (
    <div className="grid grid-cols-1 gap-4 min-[30rem]:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label={`Pass rate · ${summary.window_days} days`}
        icon={ChartBarIcon}
        tone={
          summary.pass_rate === null
            ? undefined
            : passRateTone(summary.pass_rate)
        }
        value={
          summary.pass_rate === null ? (
            "—"
          ) : (
            <span className={passRateClass(summary.pass_rate)}>
              {summary.pass_rate}%
            </span>
          )
        }
      />
      <StatTile
        label="Failing tests"
        icon={XCircleIcon}
        tone="error"
        value={summary.failing_test_count}
      />
      <StatTile
        label="Flaky tests"
        icon={ExclamationTriangleIcon}
        tone="warning"
        value={summary.flaky_test_count}
      />
      <StatTile
        label="Active runs"
        icon={BoltIcon}
        tone="info"
        value={summary.active_run_count}
      />
    </div>
  );
};
