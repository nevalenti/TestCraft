import { Link } from "@tanstack/react-router";

import { ResourceActions } from "@/components/ui/ResourceActions";
import { cn } from "@/lib/cn";

interface ResourceListItemProps {
  to?: string;
  onEdit: () => void;
  onDelete: () => void;
  label: string;
  accentText?: string;
  typeIcon?: React.ReactNode;
  testId?: string;
  children: React.ReactNode;
}

export const ResourceListItem = ({
  to,
  onEdit,
  onDelete,
  label,
  accentText = "text-primary",
  typeIcon,
  testId,
  children,
}: ResourceListItemProps) => (
  <div
    data-testid={testId}
    className="group relative flex items-center gap-3 rounded-lg border border-base-content/20 bg-base-100 px-4 py-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
  >
    {to && (
      <Link
        to={to}
        className="absolute inset-0 rounded-lg"
        aria-label={`Open ${label}`}
      />
    )}
    {typeIcon && (
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md bg-base-200",
          accentText,
        )}
      >
        {typeIcon}
      </span>
    )}
    <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
      {children}
    </div>
    <div className="relative z-10 flex shrink-0 items-center gap-1 opacity-100 transition-all duration-150 focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
      <ResourceActions
        onEdit={onEdit}
        onDelete={onDelete}
        label={label}
        size="xs"
      />
    </div>
  </div>
);
