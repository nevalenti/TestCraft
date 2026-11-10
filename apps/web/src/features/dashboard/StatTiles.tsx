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

type Tone = "success" | "warning" | "error" | "info" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  error: "border-error/30 bg-error/10 text-error",
  info: "border-info/30 bg-info/10 text-info",
  neutral: "border-secondary/30 bg-secondary/10 text-secondary",
};

const passRateTone = (rate: number): Tone => {
  if (rate >= 80) return "success";
  if (rate >= 50) return "warning";
  return "error";
};

const StatTile = ({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: StatTileProps) => (
  <div className="panel flex items-center gap-3 px-4 py-3 transition-colors hover:border-base-content/25">
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg border",
        TONE_CLASSES[tone],
      )}
    >
      <Icon className="size-5" />
    </span>
    <div className="min-w-0">
      <p className="truncate text-2xs font-semibold tracking-wider text-fg-subtle uppercase">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl leading-none font-bold text-base-content tabular-nums">
        {value}
      </p>
    </div>
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
            ? "neutral"
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
