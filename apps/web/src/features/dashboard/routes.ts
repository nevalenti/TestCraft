import { createRoute } from '@tanstack/react-router';

import { appLayoutRoute } from '@/app/routes';
import { lazyPage } from '@/components/lazyPage';

const LazyDashboardPage = lazyPage(
  () => import('./DashboardPage'),
  'DashboardPage',
);

export const indexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: LazyDashboardPage,
});
