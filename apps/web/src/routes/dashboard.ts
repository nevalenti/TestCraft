import { createRoute } from '@tanstack/react-router';

import { LazyDashboardPage } from '@/pages/lazy';
import { appLayoutRoute } from '@/routes/root';

export const indexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: LazyDashboardPage,
});
