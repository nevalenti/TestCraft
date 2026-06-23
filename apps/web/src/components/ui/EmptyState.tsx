import { InboxIcon } from "@heroicons/react/24/solid";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState = ({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 text-center select-none">
    <div className="mb-5 flex size-14 items-center justify-center rounded-xl border border-base-content/10 bg-base-200 text-base-content/40 shadow-sm">
      {icon ?? <InboxIcon className="size-6" />}
    </div>
    <p className="text-sm font-semibold tracking-tight text-base-content/80">
      {title}
    </p>
    {description && (
      <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-base-content/50">
        {description}
      </p>
    )}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);
