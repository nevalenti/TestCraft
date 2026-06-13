import React, { Suspense } from "react";

import { ViewModeSkeleton } from "@/components/ui/ViewModeSkeleton";
import { PageSkeleton } from "@/layout/PageSkeleton";
import { DashboardSkeleton } from "@/pages/DashboardPage/DashboardSkeleton";
import { ProjectDetailSkeleton } from "@/pages/ProjectDetailPage/ProjectDetailSkeleton";

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
    import("./DashboardPage/DashboardPage").then((module) => ({
      default: module.DashboardPage,
    })),
  ),
  <DashboardSkeleton />,
);

export const LazyProjectsPage = suspend(
  React.lazy(() =>
    import("./ProjectsPage/ProjectsPage").then((module) => ({
      default: module.ProjectsPage,
    })),
  ),
);

export const LazyProjectDetailPage = suspend(
  React.lazy(() =>
    import("./ProjectDetailPage/ProjectDetailPage").then((module) => ({
      default: module.ProjectDetailPage,
    })),
  ),
  <ProjectDetailSkeleton />,
);

export const LazyTestSuitePage = suspend(
  React.lazy(() =>
    import("./TestSuitePage/TestSuitePage").then((module) => ({
      default: module.TestSuitePage,
    })),
  ),
);

export const LazyTestCasePage = suspend(
  React.lazy(() =>
    import("./TestCasePage/TestCasePage").then((module) => ({
      default: module.TestCasePage,
    })),
  ),
);

export const LazyTestRunPage = suspend(
  React.lazy(() =>
    import("./TestRunPage/TestRunPage").then((module) => ({
      default: module.TestRunPage,
    })),
  ),
);

export const LazyProjectSuitesPage = suspend(
  React.lazy(() =>
    import("./ProjectDetailPage/SuitesTab").then((module) => ({
      default: module.SuitesTab,
    })),
  ),
  <ViewModeSkeleton />,
);

export const LazyProjectRunsPage = suspend(
  React.lazy(() =>
    import("./ProjectDetailPage/RunsTab").then((module) => ({
      default: module.RunsTab,
    })),
  ),
  <ViewModeSkeleton />,
);
