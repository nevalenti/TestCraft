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
  () => import('./ProjectDetailPage/SuitesTab'),
  'SuitesTab',
);

export const LazyProjectRunsPage = lazyPage(
  () => import('./ProjectDetailPage/RunsTab'),
  'RunsTab',
);

export const LazyProjectAnalyticsLayout = lazyPage(
  () => import('./ProjectDetailPage/AnalyticsLayout'),
  'AnalyticsLayout',
);

export const LazyAnalyticsTrendTab = lazyPage(
  () => import('./ProjectDetailPage/AnalyticsTrendTab'),
  'AnalyticsTrendTab',
);

export const LazyAnalyticsFlakyTab = lazyPage(
  () => import('./ProjectDetailPage/AnalyticsFlakyTab'),
  'AnalyticsFlakyTab',
);

export const LazyAnalyticsSuiteTab = lazyPage(
  () => import('./ProjectDetailPage/AnalyticsSuiteTab'),
  'AnalyticsSuiteTab',
);

export const LazyAnalyticsComparisonTab = lazyPage(
  () => import('./ProjectDetailPage/AnalyticsComparisonTab'),
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
  () => import('./ProjectDetailPage/LabelsTab'),
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
