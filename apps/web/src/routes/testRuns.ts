import { createRoute } from '@tanstack/react-router';

import { projectQueries } from '@/features/projects/api';
import { testResultQueries } from '@/features/testResults/api';
import { testRunQueries } from '@/features/testRuns/api';
import { LazyTestRunPage } from '@/pages/lazy';
import { appLayoutRoute } from '@/routes/root';

export const testRunRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/$projectId/runs/$runId',
  component: LazyTestRunPage,
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(projectQueries.detail(params.projectId)),
      queryClient.ensureQueryData(
        testRunQueries.detail(params.projectId, params.runId),
      ),
      queryClient.ensureQueryData(
        testRunQueries.summary(params.projectId, params.runId),
      ),
      queryClient.ensureQueryData(
        testResultQueries.all(params.projectId, params.runId),
      ),
    ]),
});
