import {
  createRootRoute,
  createRoute,
  createRouter,
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
  component: AppLayout,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LazyDashboardPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: LazyProjectsPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
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
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId/suites/$suiteId",
  component: LazyTestSuitePage,
});

const testCaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId/suites/$suiteId/cases/$caseId",
  component: LazyTestCasePage,
});

const testRunRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId/runs/$runId",
  component: LazyTestRunPage,
});

const testPlansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId/plans",
  component: LazyTestPlansPage,
});

const testPlanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId/plans/$planId",
  component: LazyTestPlanPage,
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/share/$token",
  component: LazySharePage,
});

const routeTree = rootRoute.addChildren([
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
  shareRoute,
]);

export const router = createRouter({ routeTree });
