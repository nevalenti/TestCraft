import React, { Suspense } from "react";

const suspend = (Component: React.ComponentType) => {
  const Suspended = () => (
    <Suspense fallback={null}>
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
);

export const LazyProjectRunsPage = suspend(
  React.lazy(() =>
    import("./ProjectDetailPage/RunsTab").then((module) => ({
      default: module.RunsTab,
    })),
  ),
);
