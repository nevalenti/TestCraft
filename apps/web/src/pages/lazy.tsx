import React, { Suspense } from "react";

import { PageSkeleton } from "@/layout/PageSkeleton";
import { DashboardSkeleton } from "@/pages/DashboardPage/DashboardSkeleton";

const suspend = (
  Component: React.ComponentType,
  fallback: React.ReactNode = <PageSkeleton />,
) => {
  const Suspended = () => (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
  Suspended.displayName = `Suspended(${Component.displayName ?? Component.name})`;
  return Suspended;
};

export const LazyDashboardPage = suspend(
  React.lazy(() =>
    import("./DashboardPage/DashboardPage").then((m) => ({
      default: m.DashboardPage,
    })),
  ),
  <DashboardSkeleton />,
);

export const LazyProjectsPage = suspend(
  React.lazy(() =>
    import("./ProjectsPage/ProjectsPage").then((m) => ({
      default: m.ProjectsPage,
    })),
  ),
);

export const LazyProjectDetailPage = suspend(
  React.lazy(() =>
    import("./ProjectDetailPage/ProjectDetailPage").then((m) => ({
      default: m.ProjectDetailPage,
    })),
  ),
);

export const LazyTestSuitePage = suspend(
  React.lazy(() =>
    import("./TestSuitePage/TestSuitePage").then((m) => ({
      default: m.TestSuitePage,
    })),
  ),
);

export const LazyTestCasePage = suspend(
  React.lazy(() =>
    import("./TestCasePage/TestCasePage").then((m) => ({
      default: m.TestCasePage,
    })),
  ),
);

export const LazyTestRunPage = suspend(
  React.lazy(() =>
    import("./TestRunPage/TestRunPage").then((m) => ({
      default: m.TestRunPage,
    })),
  ),
);
