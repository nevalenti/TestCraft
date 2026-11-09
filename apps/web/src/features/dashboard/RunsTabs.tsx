import { BoltIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { type KeyboardEvent, useRef } from "react";

import { SearchInput } from "@/components/ui/SearchInput";
import { PILL_TAB, PILL_TAB_ACTIVE } from "@/components/ui/subNavStyles";
import { TabCountBadge } from "@/components/ui/TabCountBadge";
import { RUNS_PANEL_ID, runsTabId } from "@/features/dashboard/runsTabIds";
import { cn } from "@/lib/cn";
import type { DashboardRunsTab } from "@/stores/dashboardTab";

const TABS: DashboardRunsTab[] = ["active", "completed"];

interface RunsTabsProps {
  tab: DashboardRunsTab;
  onChange: (tab: DashboardRunsTab) => void;
  activeCount: number;
  completedCount: number;
  search: string;
  onSearch: (value: string) => void;
}

export const RunsTabs = ({
  tab,
  onChange,
  activeCount,
  completedCount,
  search,
  onSearch,
}: RunsTabsProps) => {
  const tabRefs = useRef<Record<DashboardRunsTab, HTMLButtonElement | null>>({
    active: null,
    completed: null,
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    const index = TABS.indexOf(tab);
    const next = {
      ArrowRight: TABS[(index + 1) % TABS.length],
      ArrowLeft: TABS[(index - 1 + TABS.length) % TABS.length],
      Home: TABS[0],
      End: TABS.at(-1),
    }[event.key];
    if (!next) return;
    event.preventDefault();
    onChange(next);
    tabRefs.current[next]?.focus();
  };

  const renderTab = (
    value: DashboardRunsTab,
    label: string,
    count: number,
    icon: React.ReactNode,
  ) => (
    <button
      ref={(element) => {
        tabRefs.current[value] = element;
      }}
      type="button"
      role="tab"
      id={runsTabId(value)}
      aria-selected={tab === value}
      aria-controls={RUNS_PANEL_ID}
      tabIndex={tab === value ? 0 : -1}
      onClick={() => onChange(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        PILL_TAB,
        "cursor-pointer max-sm:px-2 max-sm:text-label",
        tab === value && PILL_TAB_ACTIVE,
      )}
    >
      {icon}
      {label}
      <TabCountBadge count={count} />
    </button>
  );

  return (
    <div className="flex items-center gap-3 border-b border-border p-2 md:grid md:grid-cols-[1fr_auto_1fr]">
      <div
        role="tablist"
        aria-label="Runs"
        className="order-2 -m-1 ml-auto flex min-w-0 items-center overflow-x-auto p-1 md:col-start-3 md:row-start-1 md:justify-self-end"
      >
        {renderTab(
          "active",
          "Active Runs",
          activeCount,
          <BoltIcon className="size-4 text-warning" aria-hidden="true" />,
        )}
        {renderTab(
          "completed",
          "Recently Completed",
          completedCount,
          <CheckCircleIcon
            className="size-4 text-success"
            aria-hidden="true"
          />,
        )}
      </div>
      <SearchInput
        size="sm"
        value={search}
        onChange={onSearch}
        placeholder="Search runs…"
        className="order-1 w-36 shrink-0 [&_input]:bg-base-200 sm:w-56 md:col-start-2 md:row-start-1 md:w-72"
      />
    </div>
  );
};
