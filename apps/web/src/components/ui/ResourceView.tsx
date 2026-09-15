import type { ReactElement } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ResourceSkeleton } from '@/components/ui/ResourceSkeleton';
import { SkeletonStatus } from '@/components/ui/SkeletonStatus';
import type { ViewMode } from '@/stores/viewMode';

interface ResourceViewProps<T> {
  isPending: boolean;
  showSkeleton: boolean;
  skeletonLabel: string;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  /** The full, unfiltered set — only used to decide the "nothing here yet" empty state. */
  items: T[] | undefined;
  /** What to actually render, e.g. after a client-side filter. Defaults to `items`. */
  displayItems?: T[];
  viewMode: ViewMode;
  emptyTitle: string;
  emptyDescription?: string;
  renderListItem: (item: T) => ReactElement;
  renderCard: (item: T) => ReactElement;
  gridClassName?: string;
}

const DEFAULT_GRID_CLASS =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

export function ResourceView<T>({
  isPending,
  showSkeleton,
  skeletonLabel,
  isError,
  error,
  onRetry,
  items,
  displayItems,
  viewMode,
  emptyTitle,
  emptyDescription,
  renderListItem,
  renderCard,
  gridClassName,
}: ResourceViewProps<T>) {
  if (isPending) {
    return showSkeleton ? (
      <SkeletonStatus label={skeletonLabel}>
        <ResourceSkeleton viewMode={viewMode} />
      </SkeletonStatus>
    ) : null;
  }

  if (isError) return <ErrorState error={error} onRetry={onRetry} />;

  if (items?.length === 0)
    return <EmptyState title={emptyTitle} description={emptyDescription} />;

  const list = displayItems ?? items ?? [];

  if (viewMode === 'list')
    return (
      <div className="flex flex-col gap-2">{list.map(renderListItem)}</div>
    );

  return (
    <div className={gridClassName ?? DEFAULT_GRID_CLASS}>
      {list.map(renderCard)}
    </div>
  );
}
