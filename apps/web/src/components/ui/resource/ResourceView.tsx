import type { ReactElement } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  ResourceSkeleton,
  type ViewMode,
} from "@/components/ui/skeleton/ResourceSkeleton";
import { SkeletonStatus } from "@/components/ui/skeleton/SkeletonStatus";

interface ResourceViewProps<T> {
  isPending: boolean;
  showSkeleton: boolean;
  skeletonLabel: string;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  items: T[] | undefined;
  displayItems?: T[];
  viewMode: ViewMode;
  emptyTitle: string;
  emptyDescription?: string;
  renderListItem?: (item: T) => ReactElement;
  renderCard?: (item: T) => ReactElement;
  renderTable?: (items: T[]) => ReactElement;
  gridClassName?: string;
}

const DEFAULT_GRID_CLASS =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

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

  if (viewMode === "list") {
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
