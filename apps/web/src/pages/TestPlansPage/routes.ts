import { createRoute } from '@tanstack/react-router';

import { appLayoutRoute } from '@/app/routes';
import { lazyPage } from '@/components/lazyPage';
import { projectQueries } from '@/features/projects/api';
import { testPlanQueries } from '@/features/testPlans/api';

const LazyTestPlansPage = lazyPage(
  () => import('./TestPlansPage'),
  'TestPlansPage',
);

export const testPlansRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/$projectId/plans',
  component: LazyTestPlansPage,
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(projectQueries.detail(params.projectId)),
      queryClient.ensureQueryData(testPlanQueries.all(params.projectId)),
    ]),
});
