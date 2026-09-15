import { createRoute } from '@tanstack/react-router';

import { lazyPage } from '@/components/lazyPage';
import { projectDetailRoute } from '@/features/projects/routes';
import { testSuiteQueries } from '@/features/testSuites/api';

const LazySuitesTab = lazyPage(() => import('./SuitesTab'), 'SuitesTab');

export const projectSuitesRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: 'suites',
  component: LazySuitesTab,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(testSuiteQueries.all(params.projectId)),
});
