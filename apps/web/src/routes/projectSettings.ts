import { createRoute, redirect } from '@tanstack/react-router';

import {
  LazyProjectSettingsLayout,
  LazyProjectSettingsMembersTab,
  LazyProjectSettingsNotificationsTab,
  LazyProjectSettingsTokensTab,
} from '@/pages/lazy';
import { projectDetailRoute } from '@/routes/projects';

export const projectSettingsRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: 'settings',
  component: LazyProjectSettingsLayout,
});

const projectSettingsIndexRoute = createRoute({
  getParentRoute: () => projectSettingsRoute,
  path: '/',
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/projects/$projectId/settings/tokens',
      params,
      replace: true,
    });
  },
});

const projectSettingsTokensRoute = createRoute({
  getParentRoute: () => projectSettingsRoute,
  path: 'tokens',
  component: LazyProjectSettingsTokensTab,
});

const projectSettingsNotificationsRoute = createRoute({
  getParentRoute: () => projectSettingsRoute,
  path: 'notifications',
  component: LazyProjectSettingsNotificationsTab,
});

const projectSettingsMembersRoute = createRoute({
  getParentRoute: () => projectSettingsRoute,
  path: 'members',
  component: LazyProjectSettingsMembersTab,
});

export const projectSettingsRouteTree = projectSettingsRoute.addChildren([
  projectSettingsIndexRoute,
  projectSettingsTokensRoute,
  projectSettingsNotificationsRoute,
  projectSettingsMembersRoute,
]);
