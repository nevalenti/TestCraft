import { createRoute, redirect } from '@tanstack/react-router';

import { lazyPage } from '@/components/lazyPage';
import { projectDetailRoute } from '@/features/projects/routes';

const LazyAnalyticsLayout = lazyPage(
  () => import('./AnalyticsLayout'),
  'AnalyticsLayout',
);
const LazyAnalyticsTrendTab = lazyPage(
  () => import('./AnalyticsTrendTab'),
  'AnalyticsTrendTab',
);
const LazyAnalyticsFlakyTab = lazyPage(
  () => import('./AnalyticsFlakyTab'),
  'AnalyticsFlakyTab',
);
const LazyAnalyticsSuiteTab = lazyPage(
  () => import('./AnalyticsSuiteTab'),
  'AnalyticsSuiteTab',
);
const LazyAnalyticsComparisonTab = lazyPage(
  () => import('./AnalyticsComparisonTab'),
  'AnalyticsComparisonTab',
);

export const projectAnalyticsRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: 'analytics',
  component: LazyAnalyticsLayout,
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
