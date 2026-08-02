import { createRoute } from '@tanstack/react-router';

import { LazySharePage } from '@/pages/lazy';
import { rootRoute } from '@/routes/root';

export const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share/$token',
  component: LazySharePage,
});
