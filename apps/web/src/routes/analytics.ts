import { createRoute, redirect } from '@tanstack/react-router';

import {
  LazyAnalyticsComparisonTab,
  LazyAnalyticsFlakyTab,
  LazyAnalyticsSuiteTab,
  LazyAnalyticsTrendTab,
  LazyProjectAnalyticsLayout,
} from '@/pages/lazy';
import { projectDetailRoute } from '@/routes/projects';

export const projectAnalyticsRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: 'analytics',
  component: LazyProjectAnalyticsLayout,
});

const projectAnalyticsIndexRoute = createRoute({
  getParentRoute: () => projectAnalyticsRoute,
  path: '/',
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/projects/$projectId/analytics/trend',
      params,
      replace: true,
    });
  },
});

const projectAnalyticsTrendRoute = createRoute({
  getParentRoute: () => projectAnalyticsRoute,
  path: 'trend',
  component: LazyAnalyticsTrendTab,
});

const projectAnalyticsFlakyRoute = createRoute({
  getParentRoute: () => projectAnalyticsRoute,
  path: 'flaky',
  component: LazyAnalyticsFlakyTab,
});

const projectAnalyticsSuiteRoute = createRoute({
  getParentRoute: () => projectAnalyticsRoute,
  path: 'suite',
  component: LazyAnalyticsSuiteTab,
});

const projectAnalyticsComparisonRoute = createRoute({
  getParentRoute: () => projectAnalyticsRoute,
  path: 'comparison',
  component: LazyAnalyticsComparisonTab,
});

export const analyticsRouteTree = projectAnalyticsRoute.addChildren([
  projectAnalyticsIndexRoute,
  projectAnalyticsTrendRoute,
  projectAnalyticsFlakyRoute,
  projectAnalyticsSuiteRoute,
  projectAnalyticsComparisonRoute,
]);
