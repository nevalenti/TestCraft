import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import AppLayout from "@/layout/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage/DashboardPage";
import { NotFound } from "@/pages/NotFound";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage/ProjectDetailPage";
import { ProjectsPage } from "@/pages/ProjectsPage/ProjectsPage";
import { TestCasePage } from "@/pages/TestCasePage/TestCasePage";
import { TestRunPage } from "@/pages/TestRunPage/TestRunPage";
import { TestSuitePage } from "@/pages/TestSuitePage/TestSuitePage";

const rootRoute = createRootRoute({
  component: AppLayout,
  notFoundComponent: NotFound,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: ProjectsPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId",
  component: ProjectDetailPage,
});

const testSuiteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId/suites/$suiteId",
  component: TestSuitePage,
});

const testCaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId/suites/$suiteId/cases/$caseId",
  component: TestCasePage,
});

const testRunRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId/runs/$runId",
  component: TestRunPage,
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
