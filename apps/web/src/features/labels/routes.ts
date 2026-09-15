import { createRoute } from '@tanstack/react-router';

import { lazyPage } from '@/components/lazyPage';
import { projectDetailRoute } from '@/features/projects/routes';

const LazyLabelsTab = lazyPage(() => import('./LabelsTab'), 'LabelsTab');

export const projectLabelsRoute = createRoute({
  getParentRoute: () => projectDetailRoute,
  path: 'labels',
  component: LazyLabelsTab,
});
