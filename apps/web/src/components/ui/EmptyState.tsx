import { InboxIcon } from "@heroicons/react/24/outline";

import { cn } from "@/lib/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  iconClassName?: string;
  compact?: boolean;
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  action,
  icon,
  iconClassName,
  compact,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex w-full flex-col items-center justify-center px-4 text-center",
      compact ? "rounded-xl border border-dashed border-border py-8" : "py-12",
      className,
    )}
  >
    <span
      className={cn(
        "mb-3 flex size-10 items-center justify-center rounded-xl subtle-surface text-fg-subtle [&>svg]:size-5",
        iconClassName,
      )}
    >
      {icon ?? <InboxIcon />}
    </span>
    <p className="text-sm font-semibold text-fg-secondary">{title}</p>
    {description && (
      <p className="mt-1 max-w-xs text-sm leading-relaxed text-fg-subtle">
        {description}
      </p>
    )}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);
