import { InboxIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  icon?: ReactNode;
  iconClassName?: string;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}

const ICON_FRAME =
  "flex shrink-0 items-center justify-center border border-border bg-base-100 text-fg-muted shadow-card";

export const EmptyState = ({
  title,
  description,
  action,
  secondaryAction,
  icon,
  iconClassName,
  compact,
  className,
  children,
}: EmptyStateProps) => {
  if (compact) {
    return (
      <div
        className={cn(
          "flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-border bg-base-200/40 px-4 py-4",
          className,
        )}
      >
        <span
          className={cn(
            ICON_FRAME,
            "size-9 rounded-lg [&>svg]:size-4.5",
            iconClassName,
          )}
        >
          {icon ?? <InboxIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg-secondary">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
              {description}
            </p>
          )}
        </div>
        {(action || secondaryAction) && (
          <div className="flex shrink-0 items-center gap-2">
            {action}
            {secondaryAction}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative isolate flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-base-200/40 px-6 py-12 text-center",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--color-primary) 9%, transparent), transparent 62%)",
        }}
      />
      <div className="relative mb-5 flex items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute size-20 rounded-full border border-border/70"
        />
        <span
          aria-hidden="true"
          className="absolute size-14 rounded-full bg-primary/10 blur-md"
        />
        <span
          className={cn(
            ICON_FRAME,
            "relative size-14 rounded-2xl [&>svg]:size-6",
            iconClassName,
          )}
        >
          {icon ?? <InboxIcon />}
        </span>
      </div>
      <h2 className="max-w-md font-display text-lg font-bold tracking-tight text-base-content">
        {title}
      </h2>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-fg-muted">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
      {children && <div className="mt-6 w-full max-w-md">{children}</div>}
    </div>
  );
};
