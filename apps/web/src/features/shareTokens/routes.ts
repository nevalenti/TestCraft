import { createRoute } from '@tanstack/react-router';

import { rootRoute } from '@/app/routes';
import { lazyPage } from '@/components/lazyPage';

const LazySharePage = lazyPage(() => import('./SharePage'), 'SharePage');

export const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share/$token',
  component: LazySharePage,
});
