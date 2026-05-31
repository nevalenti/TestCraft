import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import AppLayout from "@/layout/AppLayout";
import {
  LazyDashboardPage,
  LazyProjectDetailPage,
  LazyProjectsPage,
  LazyTestCasePage,
  LazyTestRunPage,
  LazyTestSuitePage,
} from "@/pages/lazy";
import { NotFound } from "@/pages/NotFound";

const rootRoute = createRootRoute({
  component: AppLayout,
  notFoundComponent: NotFound,
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
  projectDetailRoute,
  testSuiteRoute,
  testCaseRoute,
  testRunRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
