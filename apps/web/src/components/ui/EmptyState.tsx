import { InboxIcon } from '@heroicons/react/24/outline';

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
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center select-none">
    <span className={cn('text-base-content/30 opacity-70', iconClassName)}>
      {icon ?? <InboxIcon className="size-5" />}
    </span>
    <p className="text-sm font-medium text-base-content/70">{title}</p>
    {description && (
      <p className="max-w-[240px] text-xs leading-relaxed text-base-content/50">
        {description}
      </p>
    )}
    {action && <div className="mt-2 flex justify-center">{action}</div>}
  </div>
);
