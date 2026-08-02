import { createRoute, redirect } from '@tanstack/react-router';

import { projectQueries } from '@/api/projects';
import { testRunQueries } from '@/api/testRuns';
import { testSuiteQueries } from '@/api/testSuites';
import {
  LazyProjectDetailPage,
  LazyProjectLabelsPage,
  LazyProjectRunsPage,
  LazyProjectsPage,
  LazyProjectSuitesPage,
} from '@/pages/lazy';
import { appLayoutRoute } from '@/routes/root';

export const projectsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects',
  component: LazyProjectsPage,
});

export const projectDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/$projectId',
  component: LazyProjectDetailPage,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(projectQueries.detail(params.projectId)),
});

export const projectDetailIndexRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: '/',
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/projects/$projectId/runs',
      params,
      replace: true,
    });
  },
});

export const projectSuitesRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: 'suites',
  component: LazyProjectSuitesPage,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(testSuiteQueries.all(params.projectId)),
});

export const projectRunsRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: 'runs',
  component: LazyProjectRunsPage,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(testRunQueries.all(params.projectId)),
});

export const projectLabelsRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: 'labels',
  component: LazyProjectLabelsPage,
});
