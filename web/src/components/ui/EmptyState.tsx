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
    <div className="mb-5 flex size-16 items-center justify-center bg-base-200 text-base-content/20 border border-border">
      {icon ?? <InboxIcon size="size-7" />}
    </div>
    <p className="text-[15px] font-semibold text-base-content/80 tracking-tight">
      {title}
    </p>
    {description && (
      <p className="mt-1.5 max-w-[260px] text-sm text-base-content/45 leading-relaxed">
        {description}
      </p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
