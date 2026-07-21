import { TrashIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";

interface SettingsEntityListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderPrimary: (item: T) => ReactNode;
  renderSecondary?: (item: T) => ReactNode;
  onRemove: (item: T) => void;
  removeAriaLabel: (item: T) => string;
  removeLabel?: ReactNode;
  isRemoveHidden?: (item: T) => boolean;
}

export const SettingsEntityList = <T,>({
  items,
  getKey,
  renderPrimary,
  renderSecondary,
  onRemove,
  removeAriaLabel,
  removeLabel,
  isRemoveHidden,
}: SettingsEntityListProps<T>) => {
  if (items.length === 0) return null;

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={getKey(item)}
          className="flex items-center justify-between gap-4 rounded-lg border border-border bg-base-200/40 px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {renderPrimary(item)}
            </p>
            {renderSecondary && (
              <p className="truncate text-xs text-base-content/65">
                {renderSecondary(item)}
              </p>
            )}
          </div>
          {!isRemoveHidden?.(item) && (
            <button
              className="btn text-error btn-ghost btn-xs"
              onClick={() => onRemove(item)}
              aria-label={removeAriaLabel(item)}
            >
              <TrashIcon className="size-3.5" />
              {removeLabel}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
};
