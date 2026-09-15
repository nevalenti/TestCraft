import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  createRoute,
  Outlet,
} from '@tanstack/react-router';

import { NotFound } from '@/app/NotFound';
import { RootError } from '@/app/RootError';
import { AppLayout } from '@/layout/AppLayout';

export interface RouterContext {
  queryClient: QueryClient;
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});

export const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppLayout,
});
