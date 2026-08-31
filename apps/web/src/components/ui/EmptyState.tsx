import { InboxIcon } from '@heroicons/react/24/solid';

import { cn } from '@/lib/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  iconClassName?: string;
}

export const EmptyState = ({
  title,
  description,
  action,
  icon,
  iconClassName,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 text-center select-none">
    <div
      className={cn(
        'mb-4 flex size-12 items-center justify-center rounded-xl border border-border bg-base-200 text-base-content/60',
        iconClassName,
      )}
    >
      {icon ?? <InboxIcon className="size-5" />}
    </div>
    <p className="text-sm font-semibold text-base-content/80">{title}</p>
    {description && (
      <p className="mt-1.5 max-w-[220px] text-xs leading-relaxed text-base-content/65">
        {description}
      </p>
    )}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);
