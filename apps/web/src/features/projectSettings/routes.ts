import { createRoute, redirect } from '@tanstack/react-router';

import { lazyPage } from '@/components/lazyPage';
import { projectDetailRoute } from '@/features/projects/routes';

const LazyProjectSettingsLayout = lazyPage(
  () => import('./ProjectSettingsLayout'),
  'ProjectSettingsLayout',
);
const LazyApiTokensTab = lazyPage(
  () => import('./ApiTokensTab'),
  'ApiTokensTab',
);
const LazyNotificationsTab = lazyPage(
  () => import('./NotificationsTab'),
  'NotificationsTab',
);
const LazyMembersTab = lazyPage(() => import('./MembersTab'), 'MembersTab');

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
  component: LazyApiTokensTab,
});

const projectSettingsNotificationsRoute = createRoute({
  getParentRoute: () => projectSettingsRoute,
  path: 'notifications',
  component: LazyNotificationsTab,
});

const projectSettingsMembersRoute = createRoute({
  getParentRoute: () => projectSettingsRoute,
  path: 'members',
  component: LazyMembersTab,
});

export const projectSettingsRouteTree = projectSettingsRoute.addChildren([
  projectSettingsIndexRoute,
  projectSettingsTokensRoute,
  projectSettingsNotificationsRoute,
  projectSettingsMembersRoute,
]);
