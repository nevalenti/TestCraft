import { lazyPage } from '@/pages/lazyPage';

export const LazyDashboardPage = lazyPage(
  () => import('./DashboardPage/DashboardPage'),
  'DashboardPage',
);

export const LazyProjectsPage = lazyPage(
  () => import('./ProjectsPage/ProjectsPage'),
  'ProjectsPage',
);

export const LazyProjectDetailPage = lazyPage(
  () => import('./ProjectDetailPage/ProjectDetailPage'),
  'ProjectDetailPage',
);

export const LazyTestSuitePage = lazyPage(
  () => import('./TestSuitePage/TestSuitePage'),
  'TestSuitePage',
);

export const LazyTestCasePage = lazyPage(
  () => import('./TestCasePage/TestCasePage'),
  'TestCasePage',
);

export const LazyTestRunPage = lazyPage(
  () => import('./TestRunPage/TestRunPage'),
  'TestRunPage',
);

export const LazyProjectSuitesPage = lazyPage(
  () => import('@/features/testSuites/SuitesTab'),
  'SuitesTab',
);

export const LazyProjectRunsPage = lazyPage(
  () => import('@/features/testRuns/RunsTab'),
  'RunsTab',
);

export const LazyProjectAnalyticsLayout = lazyPage(
  () => import('@/features/analytics/AnalyticsLayout'),
  'AnalyticsLayout',
);

export const LazyAnalyticsTrendTab = lazyPage(
  () => import('@/features/analytics/AnalyticsTrendTab'),
  'AnalyticsTrendTab',
);

export const LazyAnalyticsFlakyTab = lazyPage(
  () => import('@/features/analytics/AnalyticsFlakyTab'),
  'AnalyticsFlakyTab',
);

export const LazyAnalyticsSuiteTab = lazyPage(
  () => import('@/features/analytics/AnalyticsSuiteTab'),
  'AnalyticsSuiteTab',
);

export const LazyAnalyticsComparisonTab = lazyPage(
  () => import('@/features/analytics/AnalyticsComparisonTab'),
  'AnalyticsComparisonTab',
);

export const LazyTestPlansPage = lazyPage(
  () => import('./TestPlansPage/TestPlansPage'),
  'TestPlansPage',
);

export const LazyTestPlanPage = lazyPage(
  () => import('./TestPlansPage/TestPlanPage'),
  'TestPlanPage',
);

export const LazyProjectLabelsPage = lazyPage(
  () => import('@/features/labels/LabelsTab'),
  'LabelsTab',
);

export const LazySharePage = lazyPage(
  () => import('./SharePage/SharePage'),
  'SharePage',
);

export const LazyAccountPage = lazyPage(
  () => import('./AccountPage/AccountPage'),
  'AccountPage',
);

export const LazySettingsPage = lazyPage(
  () => import('./SettingsPage/SettingsPage'),
  'SettingsPage',
);
