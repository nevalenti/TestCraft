import { createRouter } from '@tanstack/react-router';

import { appLayoutRoute, rootRoute } from '@/app/routes';
import { accountRoute } from '@/features/account/routes';
import { analyticsRouteTree } from '@/features/analytics/routes';
import { indexRoute } from '@/features/dashboard/routes';
import { projectLabelsRoute } from '@/features/labels/routes';
import {
  projectDetailIndexRoute,
  projectDetailRoute,
  projectsRoute,
} from '@/features/projects/routes';
import { projectSettingsRouteTree } from '@/features/projectSettings/routes';
import { shareRoute } from '@/features/shareTokens/routes';
import { projectRunsRoute } from '@/features/testRuns/routes';
import { projectSuitesRoute } from '@/features/testSuites/routes';
import { testCaseRoute } from '@/pages/TestCasePage/routes';
import { testPlanRoute } from '@/pages/TestPlanPage/routes';
import { testPlansRoute } from '@/pages/TestPlansPage/routes';
import { testRunRoute } from '@/pages/TestRunPage/routes';
import { testSuiteRoute } from '@/pages/TestSuitePage/routes';

const projectDetailRouteTree = projectDetailRoute.addChildren([
  projectDetailIndexRoute,
  projectSuitesRoute,
  projectRunsRoute,
  analyticsRouteTree,
  projectLabelsRoute,
  projectSettingsRouteTree,
]);

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    indexRoute,
    projectsRoute,
    projectDetailRouteTree,
    testSuiteRoute,
    testCaseRoute,
    testRunRoute,
    testPlansRoute,
    testPlanRoute,
    accountRoute,
  ]),
  shareRoute,
]);

export const router = createRouter({
  routeTree,
  context: { queryClient: undefined! },
});
