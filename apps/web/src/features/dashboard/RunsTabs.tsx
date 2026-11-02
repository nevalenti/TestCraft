import { BoltIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

import { SECTION_TAB, SECTION_TAB_ACTIVE } from "@/components/ui/subNavStyles";
import { cn } from "@/lib/cn";
import type { DashboardRunsTab } from "@/stores/dashboardTab";

const TabCount = ({ count }: { count: number }) => (
  <span className="rounded-full bg-base-content/10 px-1.5 py-0.5 text-xs font-semibold text-fg-muted tabular-nums">
    {count}
  </span>
);

interface RunsTabsProps {
  tab: DashboardRunsTab;
  onChange: (tab: DashboardRunsTab) => void;
  activeCount: number;
  completedCount: number;
}

export const RunsTabs = ({
  tab,
  onChange,
  activeCount,
  completedCount,
}: RunsTabsProps) => (
  <div className="flex items-center overflow-x-auto border-b border-border px-2 pt-1.5">
    <button
      type="button"
      onClick={() => onChange("active")}
      aria-pressed={tab === "active"}
      className={cn(
        SECTION_TAB,
        "cursor-pointer max-sm:px-2 max-sm:text-[13px]",
        tab === "active" && SECTION_TAB_ACTIVE,
      )}
    >
      <BoltIcon className="size-4 text-warning" aria-hidden="true" />
      Active Runs
      <TabCount count={activeCount} />
    </button>
    <button
      type="button"
      onClick={() => onChange("completed")}
      aria-pressed={tab === "completed"}
      className={cn(
        SECTION_TAB,
        "cursor-pointer max-sm:px-2 max-sm:text-[13px]",
        tab === "completed" && SECTION_TAB_ACTIVE,
      )}
    >
      <CheckCircleIcon className="size-4 text-success" aria-hidden="true" />
      Recently Completed
      <TabCount count={completedCount} />
    </button>
  </div>
);
