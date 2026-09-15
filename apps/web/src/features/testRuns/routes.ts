import { createRoute } from '@tanstack/react-router';

import { lazyPage } from '@/components/lazyPage';
import { projectDetailRoute } from '@/features/projects/routes';
import { testRunQueries } from '@/features/testRuns/api';

const LazyRunsTab = lazyPage(() => import('./RunsTab'), 'RunsTab');

export const projectRunsRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: 'runs',
  component: LazyRunsTab,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(testRunQueries.all(params.projectId)),
});
