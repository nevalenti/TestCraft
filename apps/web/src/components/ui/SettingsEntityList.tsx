import { TrashIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { SkeletonStatus } from "@/components/ui/skeleton/SkeletonStatus";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";
import { cn } from "@/lib/cn";

interface SettingsEntityListProps<T> {
  items: T[] | undefined;
  isPending: boolean;
  pendingLabel: string;
  getKey: (item: T) => string;
  renderLeading?: (item: T) => ReactNode;
  renderPrimary: (item: T) => ReactNode;
  renderSecondary?: (item: T) => ReactNode;
  renderTrailing?: (item: T) => ReactNode;
  onRemove: (item: T) => void;
  removeAriaLabel: (item: T) => string;
  removeLabel?: ReactNode;
  isRemoveHidden?: (item: T) => boolean;
  emptyTitle: string;
}

const ROW_WIDTHS = [
  ["w-48", "w-64"],
  ["w-36", "w-52"],
  ["w-56", "w-44"],
];

const SettingsEntityListSkeleton = ({
  label,
  hasLeading,
}: {
  label: string;
  hasLeading: boolean;
}) => (
  <SkeletonStatus label={label}>
    <ul className="space-y-2">
      {ROW_WIDTHS.map(([primary, secondary], index) => (
        <li
          key={index}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-base-200/40 px-4 py-2.5"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {hasLeading && (
              <Skeleton className="size-8 shrink-0 rounded-full" />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
              <Skeleton className={cn("h-3.5 max-w-full", primary)} />
              <Skeleton className={cn("h-3 max-w-full", secondary)} />
            </div>
          </div>
          <Skeleton className="size-6 shrink-0" />
        </li>
      ))}
    </ul>
  </SkeletonStatus>
);

export const SettingsEntityList = <T,>({
  items,
  isPending,
  pendingLabel,
  getKey,
  renderLeading,
  renderPrimary,
  renderSecondary,
  renderTrailing,
  onRemove,
  removeAriaLabel,
  removeLabel,
  isRemoveHidden,
  emptyTitle,
}: SettingsEntityListProps<T>) => {
  const showSkeleton = useIsLoadingVisible(isPending);

  if (isPending)
    return showSkeleton ? (
      <SettingsEntityListSkeleton
        label={pendingLabel}
        hasLeading={!!renderLeading}
      />
    ) : null;

  if (!items?.length) return <EmptyState compact title={emptyTitle} />;

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={getKey(item)}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-base-200/40 px-4 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            {renderLeading?.(item)}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {renderPrimary(item)}
              </p>
              {renderSecondary && (
                <p className="truncate text-xs text-fg-muted">
                  {renderSecondary(item)}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {renderTrailing?.(item)}
            {!isRemoveHidden?.(item) && (
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-danger-ghost"
                onClick={() => onRemove(item)}
                aria-label={removeAriaLabel(item)}
              >
                <TrashIcon className="size-3.5" aria-hidden="true" />
                {removeLabel}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};
