import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { Link, type LinkOptions } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: ReactNode;
  badge?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  nav?: ReactNode;
  backTo?: LinkOptions;
  backLabel?: string;
}

export const PageHeader = ({
  title,
  badge,
  description,
  meta,
  actions,
  nav,
  backTo,
  backLabel = "Back",
}: PageHeaderProps) => (
  <header className={cn("page-header border-b border-border", nav && "!pb-0")}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        {backTo && (
          <Link
            {...backTo}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-base-content sm:hidden"
          >
            <ArrowLeftIcon className="size-3" aria-hidden="true" />
            {backLabel}
          </Link>
        )}
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <h1 className="page-title min-w-0 break-words">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 line-clamp-2 max-w-3xl text-sm text-fg-muted">
            {description}
          </p>
        )}
        {meta && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
            {meta}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
    {nav && <div className="mt-4">{nav}</div>}
  </header>
);
