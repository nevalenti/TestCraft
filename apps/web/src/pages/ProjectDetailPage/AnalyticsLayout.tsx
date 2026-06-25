import {
  ArrowsRightLeftIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";
import { Link, Outlet } from "@tanstack/react-router";

import { useRequiredParam } from "@/hooks/useRequiredParam";

const TAB_BASE =
  "flex items-center gap-1.5 border-b-2 border-transparent pb-2 pt-0.5 text-sm font-medium whitespace-nowrap text-base-content/50 transition-colors hover:text-base-content/80";
const TAB_ACTIVE = "!border-primary !text-base-content";

export const AnalyticsLayout = () => {
  const projectId = useRequiredParam("projectId");

  return (
    <div className="pt-1">
      <div
        className="-mb-px flex items-end gap-5 overflow-x-auto border-b border-border"
        role="tablist"
      >
        <Link
          to="/projects/$projectId/analytics/trend"
          params={{ projectId }}
          role="tab"
          className={TAB_BASE}
          activeProps={{ className: TAB_ACTIVE }}
        >
          <ArrowTrendingUpIcon className="size-3.5 shrink-0" />
          Trend
        </Link>
        <Link
          to="/projects/$projectId/analytics/flaky"
          params={{ projectId }}
          role="tab"
          className={TAB_BASE}
          activeProps={{ className: TAB_ACTIVE }}
        >
          <ExclamationTriangleIcon className="size-3.5 shrink-0" />
          Flaky Tests
        </Link>
        <Link
          to="/projects/$projectId/analytics/suite"
          params={{ projectId }}
          role="tab"
          className={TAB_BASE}
          activeProps={{ className: TAB_ACTIVE }}
        >
          <Squares2X2Icon className="size-3.5 shrink-0" />
          Suite Breakdown
        </Link>
        <Link
          to="/projects/$projectId/analytics/comparison"
          params={{ projectId }}
          role="tab"
          className={TAB_BASE}
          activeProps={{ className: TAB_ACTIVE }}
        >
          <ArrowsRightLeftIcon className="size-3.5 shrink-0" />
          Run Comparison
        </Link>
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
};
