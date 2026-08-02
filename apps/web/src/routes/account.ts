import { createRoute } from '@tanstack/react-router';

import { LazyAccountPage, LazySettingsPage } from '@/pages/lazy';
import { appLayoutRoute } from '@/routes/root';

export const accountRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/account',
  component: LazyAccountPage,
});

export const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/settings',
  component: LazySettingsPage,
});
