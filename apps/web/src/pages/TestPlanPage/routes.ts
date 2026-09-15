import { createRoute } from '@tanstack/react-router';

import { appLayoutRoute } from '@/app/routes';
import { lazyPage } from '@/components/lazyPage';
import { projectQueries } from '@/features/projects/api';
import { testPlanQueries } from '@/features/testPlans/api';

const LazyTestPlanPage = lazyPage(
  () => import('./TestPlanPage'),
  'TestPlanPage',
);

export const testPlanRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/$projectId/plans/$planId',
  component: LazyTestPlanPage,
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(projectQueries.detail(params.projectId)),
      queryClient.ensureQueryData(
        testPlanQueries.detail(params.projectId, params.planId),
      ),
      queryClient.ensureQueryData(
        testPlanQueries.cases(params.projectId, params.planId),
      ),
    ]),
});
