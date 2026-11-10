import { InboxIcon } from "@heroicons/react/24/outline";

import { cn } from "@/lib/cn";

interface EmptyStateProps {
  title: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  iconClassName?: string;
  compact?: boolean;
  className?: string;
}

export const EmptyState = ({
  title,
  action,
  icon,
  iconClassName,
  compact,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex w-full items-center justify-center px-4 text-center",
      compact
        ? "gap-3 rounded-xl border border-dashed border-border py-6"
        : "flex-col gap-3 py-10",
      className,
    )}
  >
    <span
      className={cn(
        "flex shrink-0 items-center justify-center border border-border subtle-surface text-fg-subtle",
        compact
          ? "size-9 rounded-lg [&>svg]:size-4.5"
          : "size-11 rounded-xl [&>svg]:size-5",
        iconClassName,
      )}
    >
      {icon ?? <InboxIcon />}
    </span>
    <p className="text-sm font-semibold text-fg-secondary">{title}</p>
    {action && <div className="flex justify-center">{action}</div>}
  </div>
);
