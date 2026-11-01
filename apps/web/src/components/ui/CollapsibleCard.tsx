import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { type ReactNode, useId, useState } from "react";

import { cn } from "@/lib/cn";
import { readStorage, writeStorage } from "@/lib/storage";

const STORAGE_PREFIX = "testcraft:collapsed:";

const readCollapsed = (
  storageKey: string | undefined,
  isCollapsedByDefault: boolean,
) => {
  if (!storageKey) return isCollapsedByDefault;
  const stored = readStorage(STORAGE_PREFIX + storageKey);
  return stored === null ? isCollapsedByDefault : stored === "true";
};

const storeCollapsed = (
  storageKey: string | undefined,
  isCollapsed: boolean,
) => {
  if (storageKey)
    writeStorage(STORAGE_PREFIX + storageKey, String(isCollapsed));
};

interface CollapsibleCardProps {
  title: string;
  description?: ReactNode;
  storageKey?: string;
  defaultCollapsed?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}

export const CollapsibleCard = ({
  title,
  description,
  storageKey,
  defaultCollapsed = false,
  actions,
  children,
}: CollapsibleCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() =>
    readCollapsed(storageKey, defaultCollapsed),
  );
  const contentId = useId();

  const toggle = () => {
    setIsCollapsed((previous) => {
      storeCollapsed(storageKey, !previous);
      return !previous;
    });
  };

  return (
    <section className={cn("panel flex flex-col", isCollapsed && "h-fit")}>
      <header
        className={cn(
          "group/header flex items-center gap-2 pr-3 transition-colors has-[>button:hover]:bg-base-content/6",
          isCollapsed ? "rounded-xl" : "rounded-t-xl border-b border-border",
        )}
      >
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!isCollapsed}
          aria-controls={contentId}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 self-stretch py-3 pl-4 text-left focus-visible:outline-offset-[-2px]"
        >
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-fg-subtle transition-[transform,color] duration-200 group-has-[>button:hover]/header:text-fg-secondary",
              isCollapsed && "-rotate-90",
            )}
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-base-content">
              {title}
            </span>
            {description && (
              <span className="block truncate text-xs text-fg-subtle">
                {description}
              </span>
            )}
          </span>
        </button>
        {actions}
      </header>
      <div id={contentId} hidden={isCollapsed} className="flex flex-1 flex-col">
        {children}
      </div>
    </section>
  );
};
