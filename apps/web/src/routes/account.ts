import { createRoute } from '@tanstack/react-router';

import { LazyAccountPage } from '@/pages/lazy';
import { appLayoutRoute } from '@/routes/root';

export const accountRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/account',
  component: LazyAccountPage,
});
