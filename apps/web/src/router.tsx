import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";

import { RootError } from "@/components/RootError";
import AppLayout from "@/layout/AppLayout";
import {
  LazyDashboardPage,
  LazyProjectAnalyticsPage,
  LazyProjectDetailPage,
  LazyProjectLabelsPage,
  LazyProjectRunsPage,
  LazyProjectsPage,
  LazyProjectSuitesPage,
  LazySharePage,
  LazyTestCasePage,
  LazyTestPlanPage,
  LazyTestPlansPage,
  LazyTestRunPage,
  LazyTestSuitePage,
} from "@/pages/lazy";
import { NotFound } from "@/pages/NotFound";

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/",
  component: LazyDashboardPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects",
  component: LazyProjectsPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects/$projectId",
  component: LazyProjectDetailPage,
});

const projectDetailIndexRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: "/",
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/projects/$projectId/runs",
      params,
      replace: true,
    });
  },
});

const projectSuitesRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: "suites",
  component: LazyProjectSuitesPage,
});

const projectRunsRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: "runs",
  component: LazyProjectRunsPage,
});

const projectAnalyticsRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: "analytics",
  component: LazyProjectAnalyticsPage,
});

const projectLabelsRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: "labels",
  component: LazyProjectLabelsPage,
});

const testSuiteRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects/$projectId/suites/$suiteId",
  component: LazyTestSuitePage,
});

const testCaseRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects/$projectId/suites/$suiteId/cases/$caseId",
  component: LazyTestCasePage,
});

const testRunRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects/$projectId/runs/$runId",
  component: LazyTestRunPage,
});

const testPlansRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects/$projectId/plans",
  component: LazyTestPlansPage,
});

const testPlanRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects/$projectId/plans/$planId",
  component: LazyTestPlanPage,
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/share/$token",
  component: LazySharePage,
});

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    indexRoute,
    projectsRoute,
    projectDetailRoute.addChildren([
      projectDetailIndexRoute,
      projectSuitesRoute,
      projectRunsRoute,
      projectAnalyticsRoute,
      projectLabelsRoute,
    ]),
    testSuiteRoute,
    testCaseRoute,
    testRunRoute,
    testPlansRoute,
    testPlanRoute,
  ]),
  shareRoute,
]);

export const router = createRouter({ routeTree });
