import { useLayoutEffect } from 'react';

import { type BreadcrumbItem, useBreadcrumbsStore } from '@/stores/breadcrumbs';

export const useBreadcrumbs = (items: BreadcrumbItem[]) => {
  const set = useBreadcrumbsStore((store) => store.set);
  const serialized = JSON.stringify(items);

  useLayoutEffect(() => {
    set(items);
  }, [serialized, set]);
};
