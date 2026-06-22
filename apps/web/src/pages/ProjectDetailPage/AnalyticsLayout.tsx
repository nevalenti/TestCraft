import {
  ArrowsRightLeftIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";
import { Link, Outlet } from "@tanstack/react-router";

import { useRequiredParam } from "@/hooks/useRequiredParam";

const TAB = "tab gap-1.5 text-sm font-medium leading-none";
const TAB_ACTIVE = "tab tab-active gap-1.5 text-sm font-medium leading-none";

export const AnalyticsLayout = () => {
  const projectId = useRequiredParam("projectId");

  return (
    <div className="space-y-6 py-2">
      <div role="tablist" className="tabs-bordered tabs">
        <Link
          to="/projects/$projectId/analytics/trend"
          params={{ projectId }}
          role="tab"
          className={TAB}
          activeProps={{ className: TAB_ACTIVE }}
        >
          <ArrowTrendingUpIcon className="size-3.5" />
          Trend
        </Link>
        <Link
          to="/projects/$projectId/analytics/flaky"
          params={{ projectId }}
          role="tab"
          className={TAB}
          activeProps={{ className: TAB_ACTIVE }}
        >
          <ExclamationTriangleIcon className="size-3.5" />
          Flaky Tests
        </Link>
        <Link
          to="/projects/$projectId/analytics/suite"
          params={{ projectId }}
          role="tab"
          className={TAB}
          activeProps={{ className: TAB_ACTIVE }}
        >
          <Squares2X2Icon className="size-3.5" />
          Suite Breakdown
        </Link>
        <Link
          to="/projects/$projectId/analytics/comparison"
          params={{ projectId }}
          role="tab"
          className={TAB}
          activeProps={{ className: TAB_ACTIVE }}
        >
          <ArrowsRightLeftIcon className="size-3.5" />
          Run Comparison
        </Link>
      </div>

      <Outlet />
    </div>
  );
};
