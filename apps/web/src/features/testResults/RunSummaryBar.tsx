import {
  ListBulletIcon,
  PlusIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/solid";
import { TestResultStatus, type TestRunSummary } from "@testcraft/types";

import { ListToolbar } from "@/components/ui/ListToolbar";
import {
  STATUS_COLOR,
  STATUS_OPTIONS,
} from "@/features/testResults/resultStatus";
import { cn } from "@/lib/cn";
import { passRateClass } from "@/lib/format";

type SummaryCountKey = "passed" | "failed" | "blocked" | "skipped" | "untested";

const STATUS_TO_SUMMARY_KEY: Record<string, SummaryCountKey> = {
  passed: "passed",
  failed: "failed",
  blocked: "blocked",
  skipped: "skipped",
  untested: "untested",
};

interface RunSummaryBarProps {
  runSummary: TestRunSummary;
  statusFilter: TestResultStatus | null;
  onStatusFilter: (status: TestResultStatus | null) => void;
  search: string;
  onSearch: (value: string) => void;
  onAdd?: () => void;
  isGrouped?: boolean;
  onGroupedChange?: (isGrouped: boolean) => void;
}

export const RunSummaryBar = ({
  runSummary,
  statusFilter,
  onStatusFilter,
  search,
  onSearch,
  onAdd,
  isGrouped = false,
  onGroupedChange,
}: RunSummaryBarProps) => (
  <>
    <ListToolbar
      search={search}
      onSearch={onSearch}
      placeholder="Search test cases…"
    >
      {onGroupedChange && (
        <div
          role="group"
          aria-label="Group results"
          className="flex items-center gap-0.5 rounded-lg bg-base-content/6 p-0.5 text-xs"
        >
          {[
            { value: false, label: "List", Icon: ListBulletIcon },
            { value: true, label: "By suite", Icon: RectangleGroupIcon },
          ].map(({ value, label, Icon }) => (
            <button
              key={label}
              type="button"
              aria-pressed={isGrouped === value}
              onClick={() => onGroupedChange(value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
                isGrouped === value
                  ? "bg-base-100 text-base-content shadow-sm"
                  : "text-fg-muted hover:text-base-content",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      )}
      {onAdd && (
        <button className="btn btn-sm btn-primary" onClick={onAdd}>
          <PlusIcon className="size-4" aria-hidden="true" />
          Add Result
        </button>
      )}
    </ListToolbar>

    <section aria-label="Run summary" className="mb-4 panel p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={cn(
            "font-display text-2xl font-bold tabular-nums",
            passRateClass(runSummary.pass_rate),
          )}
        >
          {runSummary.pass_rate}%
        </span>
        <span className="text-sm text-fg-muted">pass rate</span>
        <span className="ml-auto text-sm text-fg-muted">
          <span className="font-semibold text-base-content">
            {runSummary.total}
          </span>{" "}
          result{runSummary.total === 1 ? "" : "s"} ·{" "}
          {runSummary.total - runSummary.untested} executed
          {runSummary.untested > 0 && <> · {runSummary.untested} not run yet</>}
        </span>
      </div>

      {runSummary.total > 0 && (
        <div
          aria-hidden="true"
          className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full bg-base-content/8"
        >
          {STATUS_OPTIONS.map(({ value }) => {
            const count = runSummary[STATUS_TO_SUMMARY_KEY[value]];
            return count > 0 ? (
              <span
                key={value}
                className={cn("h-full", STATUS_COLOR[value])}
                style={{ width: `${(count / runSummary.total) * 100}%` }}
              />
            ) : null;
          })}
        </div>
      )}

      <div
        className="mt-3 flex flex-wrap gap-1.5"
        role="group"
        aria-label="Filter by status"
      >
        {statusFilter !== null && (
          <button
            type="button"
            onClick={() => onStatusFilter(null)}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-fg-secondary transition-colors hover:bg-base-content/6 hover:text-base-content"
          >
            All results
          </button>
        )}
        {STATUS_OPTIONS.map(({ value, label }) => {
          const count = runSummary[STATUS_TO_SUMMARY_KEY[value]];
          const isActive = statusFilter === value;

          return count > 0 ? (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              onClick={() =>
                onStatusFilter(isActive ? null : (value as TestResultStatus))
              }
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-base-content/30 bg-base-content/10 text-base-content"
                  : "border-border text-fg-secondary hover:bg-base-content/6 hover:text-base-content",
                statusFilter !== null && !isActive && "opacity-60",
              )}
            >
              <span
                aria-hidden="true"
                className={cn("size-2 rounded-full", STATUS_COLOR[value])}
              />
              {label}
              <span className="font-semibold text-base-content tabular-nums">
                {count}
              </span>
            </button>
          ) : null;
        })}
      </div>
    </section>
  </>
);
