import { PlusIcon } from "@heroicons/react/24/solid";
import { TestResultStatus, type TestRunSummary } from "@testcraft/types";

import { ListToolbar } from "@/components/ui/ListToolbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { statusOptions } from "@/lib/constants";

type SummaryCountKey = "passed" | "failed" | "blocked" | "skipped";

const STATUS_TO_SUMMARY_KEY: Record<string, SummaryCountKey> = {
  Passed: "passed",
  Failed: "failed",
  Blocked: "blocked",
  Skipped: "skipped",
};

const passRateClass = (rate: number) => {
  if (rate >= 80) return "text-success";
  if (rate >= 50) return "text-warning";

  return "text-error";
};

interface RunSummaryBarProps {
  runSummary: TestRunSummary;
  statusFilter: TestResultStatus | null;
  onStatusFilter: (status: TestResultStatus | null) => void;
  search: string;
  onSearch: (value: string) => void;
  onAdd: () => void;
}

export const RunSummaryBar = ({
  runSummary,
  statusFilter,
  onStatusFilter,
  search,
  onSearch,
  onAdd,
}: RunSummaryBarProps) => (
  <>
    <ListToolbar
      search={search}
      onSearch={onSearch}
      placeholder="Search test cases…"
    >
      <button className="btn btn-sm btn-primary" onClick={onAdd}>
        <PlusIcon className="size-4" aria-hidden="true" />
        Add Result
      </button>
    </ListToolbar>

    <div className="mb-3 flex flex-wrap gap-1.5">
      {statusFilter !== null && (
        <button
          onClick={() => onStatusFilter(null)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-base-100 px-2.5 py-1.5 text-xs font-medium text-base-content/85 transition-colors hover:bg-base-200 hover:text-base-content"
        >
          All results
        </button>
      )}
      {statusOptions.map(({ value }) => {
        const count = runSummary[STATUS_TO_SUMMARY_KEY[value]];

        return count > 0 ? (
          <button
            key={value}
            onClick={() =>
              onStatusFilter(
                statusFilter === value ? null : (value as TestResultStatus),
              )
            }
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              statusFilter === value
                ? "border-base-content/25 bg-base-200 shadow-sm"
                : "border-border bg-base-100 hover:bg-base-200"
            }`}
          >
            <StatusBadge status={value} />
            <span className="font-bold text-base-content/85 tabular-nums">
              {count}
            </span>
          </button>
        ) : null;
      })}
    </div>

    <p className="mb-4 px-1 text-sm text-base-content/80">
      <span className="font-semibold text-base-content">
        {runSummary.total}
      </span>{" "}
      result{runSummary.total === 1 ? "" : "s"} ·{" "}
      <span className={`font-semibold ${passRateClass(runSummary.passRate)}`}>
        {runSummary.passRate}%
      </span>{" "}
      pass rate
    </p>
  </>
);
