import type { ReactElement } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ResourceSkeleton,
  type ViewMode,
} from '@/components/ui/ResourceSkeleton';
import { SkeletonStatus } from '@/components/ui/SkeletonStatus';

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
  /** Used in list view when renderTable isn't given. */
  renderListItem?: (item: T) => ReactElement;
  /** Used in grid view. */
  renderCard?: (item: T) => ReactElement;
  /** When set, list view renders this table instead of the default stacked-row list. */
  renderTable?: (items: T[]) => ReactElement;
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
  renderTable,
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

  if (viewMode === 'list') {
    if (renderTable) return renderTable(list);
    if (renderListItem)
      return (
        <div className="flex flex-col gap-2">{list.map(renderListItem)}</div>
      );
  }

  if (renderCard)
    return (
      <div className={gridClassName ?? DEFAULT_GRID_CLASS}>
        {list.map(renderCard)}
      </div>
    );

  return null;
}
