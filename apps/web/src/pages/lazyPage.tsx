import React, { Suspense } from 'react';

import { LoadingFallback } from '@/pages/LoadingFallback';

export const lazyPage = <
  M extends Record<string, React.ComponentType>,
  K extends keyof M & string,
>(
  loader: () => Promise<M>,
  exportName: K,
) => {
  const LazyComponent = React.lazy(async () => {
    const module = await loader();
    return { default: module[exportName] };
  }) as unknown as React.ComponentType;

  const Suspended = () => (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent />
    </Suspense>
  );

  Suspended.displayName = `Suspended(${exportName})`;

  return Suspended;
};
