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
  LazyProjectDetailPage,
  LazyProjectRunsPage,
  LazyProjectsPage,
  LazyProjectSuitesPage,
  LazyTestCasePage,
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  projectsRoute,
  projectDetailRoute.addChildren([
    projectDetailIndexRoute,
    projectSuitesRoute,
    projectRunsRoute,
  ]),
  testSuiteRoute,
  testCaseRoute,
  testRunRoute,
]);

export const router = createRouter({ routeTree });
