import { TrashIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/ui/EmptyState";

interface SettingsEntityListProps<T> {
  items: T[];
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

export const SettingsEntityList = <T,>({
  items,
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
  if (items.length === 0) return <EmptyState compact title={emptyTitle} />;

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
