import React, { Suspense } from 'react';

const suspend = (Component: React.ComponentType) => {
  const Suspended = () => (
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  );

  Suspended.displayName = `Suspended(${Component.displayName ?? Component.name})`;

  return Suspended;
};

export const LazyDashboardPage = suspend(
  React.lazy(async () => {
    const module = await import('./DashboardPage/DashboardPage');
    return { default: module.DashboardPage };
  }),
);

export const LazyProjectsPage = suspend(
  React.lazy(async () => {
    const module = await import('./ProjectsPage/ProjectsPage');
    return { default: module.ProjectsPage };
  }),
);

export const LazyProjectDetailPage = suspend(
  React.lazy(async () => {
    const module = await import('./ProjectDetailPage/ProjectDetailPage');
    return { default: module.ProjectDetailPage };
  }),
);

export const LazyTestSuitePage = suspend(
  React.lazy(async () => {
    const module = await import('./TestSuitePage/TestSuitePage');
    return { default: module.TestSuitePage };
  }),
);

export const LazyTestCasePage = suspend(
  React.lazy(async () => {
    const module = await import('./TestCasePage/TestCasePage');
    return { default: module.TestCasePage };
  }),
);

export const LazyTestRunPage = suspend(
  React.lazy(async () => {
    const module = await import('./TestRunPage/TestRunPage');
    return { default: module.TestRunPage };
  }),
);

export const LazyProjectSuitesPage = suspend(
  React.lazy(async () => {
    const module = await import('./ProjectDetailPage/SuitesTab');
    return { default: module.SuitesTab };
  }),
);

export const LazyProjectRunsPage = suspend(
  React.lazy(async () => {
    const module = await import('./ProjectDetailPage/RunsTab');
    return { default: module.RunsTab };
  }),
);

export const LazyProjectAnalyticsLayout = suspend(
  React.lazy(async () => {
    const module = await import('./ProjectDetailPage/AnalyticsLayout');
    return { default: module.AnalyticsLayout };
  }),
);

export const LazyAnalyticsTrendTab = suspend(
  React.lazy(async () => {
    const module = await import('./ProjectDetailPage/AnalyticsTrendTab');
    return { default: module.AnalyticsTrendTab };
  }),
);

export const LazyAnalyticsFlakyTab = suspend(
  React.lazy(async () => {
    const module = await import('./ProjectDetailPage/AnalyticsFlakyTab');
    return { default: module.AnalyticsFlakyTab };
  }),
);

export const LazyAnalyticsSuiteTab = suspend(
  React.lazy(async () => {
    const module = await import('./ProjectDetailPage/AnalyticsSuiteTab');
    return { default: module.AnalyticsSuiteTab };
  }),
);

export const LazyAnalyticsComparisonTab = suspend(
  React.lazy(async () => {
    const module = await import('./ProjectDetailPage/AnalyticsComparisonTab');
    return { default: module.AnalyticsComparisonTab };
  }),
);

export const LazyTestPlansPage = suspend(
  React.lazy(async () => {
    const module = await import('./TestPlansPage/TestPlansPage');
    return { default: module.TestPlansPage };
  }),
);

export const LazyTestPlanPage = suspend(
  React.lazy(async () => {
    const module = await import('./TestPlansPage/TestPlanPage');
    return { default: module.TestPlanPage };
  }),
);

export const LazyProjectLabelsPage = suspend(
  React.lazy(async () => {
    const module = await import('./ProjectDetailPage/LabelsTab');
    return { default: module.LabelsTab };
  }),
);

export const LazySharePage = suspend(
  React.lazy(async () => {
    const module = await import('./SharePage/SharePage');
    return { default: module.SharePage };
  }),
);

export const LazyAccountPage = suspend(
  React.lazy(async () => {
    const module = await import('./AccountPage/AccountPage');
    return { default: module.AccountPage };
  }),
);

export const LazySettingsPage = suspend(
  React.lazy(async () => {
    const module = await import('./SettingsPage/SettingsPage');
    return { default: module.SettingsPage };
  }),
);
