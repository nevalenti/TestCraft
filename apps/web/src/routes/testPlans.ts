import { createRoute } from '@tanstack/react-router';

import { projectQueries } from '@/features/projects/api';
import { testPlanQueries } from '@/features/testPlans/api';
import { LazyTestPlanPage, LazyTestPlansPage } from '@/pages/lazy';
import { appLayoutRoute } from '@/routes/root';

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
