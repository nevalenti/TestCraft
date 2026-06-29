import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";

import { projectQueries } from "@/api/projects";
import { testCaseQueries } from "@/api/testCases";
import { testCaseStepQueries } from "@/api/testCaseSteps";
import { testPlanQueries } from "@/api/testPlans";
import { testResultQueries } from "@/api/testResults";
import { testRunQueries } from "@/api/testRuns";
import { testSuiteQueries } from "@/api/testSuites";
import { RootError } from "@/components/RootError";
import AppLayout from "@/layout/AppLayout";
import {
  LazyAccountPage,
  LazyAnalyticsComparisonTab,
  LazyAnalyticsFlakyTab,
  LazyAnalyticsSuiteTab,
  LazyAnalyticsTrendTab,
  LazyDashboardPage,
  LazyProjectAnalyticsLayout,
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

interface RouterContext {
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
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
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      projectQueries.detail(params.projectId),
    ),
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
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(testSuiteQueries.all(params.projectId)),
});

const projectRunsRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: "runs",
  component: LazyProjectRunsPage,
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(testRunQueries.all(params.projectId)),
});

const projectAnalyticsRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: "analytics",
  component: LazyProjectAnalyticsLayout,
});

const projectAnalyticsIndexRoute = createRoute({
  getParentRoute: () => projectAnalyticsRoute,
  path: "/",
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/projects/$projectId/analytics/trend",
      params,
      replace: true,
    });
  },
});

const projectAnalyticsTrendRoute = createRoute({
  getParentRoute: () => projectAnalyticsRoute,
  path: "trend",
  component: LazyAnalyticsTrendTab,
});

const projectAnalyticsFlakyRoute = createRoute({
  getParentRoute: () => projectAnalyticsRoute,
  path: "flaky",
  component: LazyAnalyticsFlakyTab,
});

const projectAnalyticsSuiteRoute = createRoute({
  getParentRoute: () => projectAnalyticsRoute,
  path: "suite",
  component: LazyAnalyticsSuiteTab,
});

const projectAnalyticsComparisonRoute = createRoute({
  getParentRoute: () => projectAnalyticsRoute,
  path: "comparison",
  component: LazyAnalyticsComparisonTab,
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
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        projectQueries.detail(params.projectId),
      ),
      context.queryClient.ensureQueryData(
        testSuiteQueries.detail(params.projectId, params.suiteId),
      ),
      context.queryClient.ensureQueryData(
        testCaseQueries.all(params.projectId, params.suiteId),
      ),
    ]),
});

const testCaseRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects/$projectId/suites/$suiteId/cases/$caseId",
  component: LazyTestCasePage,
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        projectQueries.detail(params.projectId),
      ),
      context.queryClient.ensureQueryData(
        testSuiteQueries.detail(params.projectId, params.suiteId),
      ),
      context.queryClient.ensureQueryData(
        testCaseQueries.detail(params.projectId, params.suiteId, params.caseId),
      ),
      context.queryClient.ensureQueryData(
        testCaseStepQueries.all(
          params.projectId,
          params.suiteId,
          params.caseId,
        ),
      ),
    ]),
});

const testRunRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects/$projectId/runs/$runId",
  component: LazyTestRunPage,
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        projectQueries.detail(params.projectId),
      ),
      context.queryClient.ensureQueryData(
        testRunQueries.detail(params.projectId, params.runId),
      ),
      context.queryClient.ensureQueryData(
        testRunQueries.summary(params.projectId, params.runId),
      ),
      context.queryClient.ensureQueryData(
        testResultQueries.all(params.projectId, params.runId),
      ),
    ]),
});

const testPlansRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects/$projectId/plans",
  component: LazyTestPlansPage,
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        projectQueries.detail(params.projectId),
      ),
      context.queryClient.ensureQueryData(
        testPlanQueries.all(params.projectId),
      ),
    ]),
});

const testPlanRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects/$projectId/plans/$planId",
  component: LazyTestPlanPage,
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        projectQueries.detail(params.projectId),
      ),
      context.queryClient.ensureQueryData(
        testPlanQueries.detail(params.projectId, params.planId),
      ),
      context.queryClient.ensureQueryData(
        testPlanQueries.cases(params.projectId, params.planId),
      ),
    ]),
});

const accountRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/account",
  component: LazyAccountPage,
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/share/$token",
  component: LazySharePage,
});

const analyticsRouteTree = projectAnalyticsRoute.addChildren([
  projectAnalyticsIndexRoute,
  projectAnalyticsTrendRoute,
  projectAnalyticsFlakyRoute,
  projectAnalyticsSuiteRoute,
  projectAnalyticsComparisonRoute,
]);

const projectDetailRouteTree = projectDetailRoute.addChildren([
  projectDetailIndexRoute,
  projectSuitesRoute,
  projectRunsRoute,
  analyticsRouteTree,
  projectLabelsRoute,
]);

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    indexRoute,
    projectsRoute,
    projectDetailRouteTree,
    testSuiteRoute,
    testCaseRoute,
    testRunRoute,
    testPlansRoute,
    testPlanRoute,
    accountRoute,
  ]),
  shareRoute,
]);

export const router = createRouter({
  routeTree,
  context: { queryClient: undefined! },
});
