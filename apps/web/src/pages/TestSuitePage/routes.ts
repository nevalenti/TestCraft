import { createRoute } from '@tanstack/react-router';

import { appLayoutRoute } from '@/app/routes';
import { lazyPage } from '@/components/lazyPage';
import { projectQueries } from '@/features/projects/api';
import { testCaseQueries } from '@/features/testCases/api';
import { testSuiteQueries } from '@/features/testSuites/api';

const LazyTestSuitePage = lazyPage(
  () => import('./TestSuitePage'),
  'TestSuitePage',
);

export const testSuiteRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/$projectId/suites/$suiteId',
  component: LazyTestSuitePage,
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(projectQueries.detail(params.projectId)),
      queryClient.ensureQueryData(
        testSuiteQueries.detail(params.projectId, params.suiteId),
      ),
      queryClient.ensureQueryData(
        testCaseQueries.all(params.projectId, params.suiteId),
      ),
    ]),
});
