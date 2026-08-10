import { createRoute } from '@tanstack/react-router';

import { projectQueries } from '@/features/projects/api';
import { testCaseQueries } from '@/features/testCases/api';
import { testCaseStepQueries } from '@/features/testCaseSteps/api';
import { testSuiteQueries } from '@/features/testSuites/api';
import { LazyTestCasePage, LazyTestSuitePage } from '@/pages/lazy';
import { appLayoutRoute } from '@/routes/root';

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

export const testCaseRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/projects/$projectId/suites/$suiteId/cases/$caseId',
  component: LazyTestCasePage,
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(projectQueries.detail(params.projectId)),
      queryClient.ensureQueryData(
        testSuiteQueries.detail(params.projectId, params.suiteId),
      ),
      queryClient.ensureQueryData(
        testCaseQueries.detail(params.projectId, params.suiteId, params.caseId),
      ),
      queryClient.ensureQueryData(
        testCaseStepQueries.all(
          params.projectId,
          params.suiteId,
          params.caseId,
        ),
      ),
    ]),
});
