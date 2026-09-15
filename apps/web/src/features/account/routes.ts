import { createRoute } from '@tanstack/react-router';

import { appLayoutRoute } from '@/app/routes';
import { lazyPage } from '@/components/lazyPage';

const LazyAccountPage = lazyPage(() => import('./AccountPage'), 'AccountPage');

export const accountRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/account',
  component: LazyAccountPage,
});
