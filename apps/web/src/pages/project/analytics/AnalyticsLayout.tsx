import {
  ArrowsRightLeftIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";
import { getRouteApi, Link, Outlet } from "@tanstack/react-router";

import { SubNav } from "@/components/ui/SubNav";
import { SUB_NAV_ACTIVE, SUB_NAV_ITEM } from "@/components/ui/subNavStyles";

const routeApi = getRouteApi("/_app/projects/$projectId/analytics");

export const AnalyticsLayout = () => {
  const { projectId } = routeApi.useParams();

  return (
    <div className="pt-1">
      <SubNav label="Analytics views">
        <Link
          to="/projects/$projectId/analytics/trend"
          params={{ projectId }}
          className={SUB_NAV_ITEM}
          activeProps={{ className: SUB_NAV_ACTIVE }}
        >
          <ArrowTrendingUpIcon className="size-3.5 shrink-0" />
          Trend
        </Link>
        <Link
          to="/projects/$projectId/analytics/flaky"
          params={{ projectId }}
          className={SUB_NAV_ITEM}
          activeProps={{ className: SUB_NAV_ACTIVE }}
        >
          <ExclamationTriangleIcon className="size-3.5 shrink-0" />
          Flaky Tests
        </Link>
        <Link
          to="/projects/$projectId/analytics/suite"
          params={{ projectId }}
          className={SUB_NAV_ITEM}
          activeProps={{ className: SUB_NAV_ACTIVE }}
        >
          <Squares2X2Icon className="size-3.5 shrink-0" />
          Suite Breakdown
        </Link>
        <Link
          to="/projects/$projectId/analytics/comparison"
          params={{ projectId }}
          className={SUB_NAV_ITEM}
          activeProps={{ className: SUB_NAV_ACTIVE }}
        >
          <ArrowsRightLeftIcon className="size-3.5 shrink-0" />
          Run Comparison
        </Link>
      </SubNav>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
};
