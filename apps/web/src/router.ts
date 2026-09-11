import { createRouter } from '@tanstack/react-router';

import { accountRoute } from '@/routes/account';
import { analyticsRouteTree } from '@/routes/analytics';
import { indexRoute } from '@/routes/dashboard';
import {
  projectDetailIndexRoute,
  projectDetailRoute,
  projectLabelsRoute,
  projectRunsRoute,
  projectsRoute,
  projectSuitesRoute,
} from '@/routes/projects';
import { projectSettingsRouteTree } from '@/routes/projectSettings';
import { appLayoutRoute, rootRoute } from '@/routes/root';
import { shareRoute } from '@/routes/share';
import { testPlanRoute, testPlansRoute } from '@/routes/testPlans';
import { testRunRoute } from '@/routes/testRuns';
import { testCaseRoute, testSuiteRoute } from '@/routes/testSuites';

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
