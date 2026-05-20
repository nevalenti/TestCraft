import { InboxIcon } from "@/components/ui/icons";

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
    <div className="mb-5 flex size-14 items-center justify-center bg-base-200 text-base-content/40 border border-border/60 shadow-sm">
      {icon ?? <InboxIcon size="size-6" />}
    </div>
    <p className="text-sm font-semibold text-base-content/80 tracking-tight">
      {title}
    </p>
    {description && (
      <p className="mt-1.5 max-w-[240px] text-xs text-base-content/50 leading-relaxed">
        {description}
      </p>
    )}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);
