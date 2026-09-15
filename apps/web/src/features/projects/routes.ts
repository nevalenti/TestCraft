import { createRoute, redirect } from '@tanstack/react-router';

import { appLayoutRoute } from '@/app/routes';
import { lazyPage } from '@/components/lazyPage';
import { projectQueries } from '@/features/projects/api';

const LazyProjectsPage = lazyPage(
  () => import('./ProjectsPage'),
  'ProjectsPage',
);

const LazyProjectDetailPage = lazyPage(
  () => import('./ProjectDetailPage'),
  'ProjectDetailPage',
);

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
