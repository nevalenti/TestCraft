import { Link } from "@tanstack/react-router";

import { ResourceActions } from "@/components/ui/resource/ResourceActions";
import { cn } from "@/lib/cn";

interface ResourceCardProps {
  to?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  label: string;
  cardBg?: string;
  accentText?: string;
  typeIcon?: React.ReactNode;
  testId?: string;
  children: React.ReactNode;
}

export const ResourceCard = ({
  to,
  onEdit,
  onDelete,
  label,
  cardBg = "bg-base-200",
  accentText = "text-primary",
  typeIcon,
  testId,
  children,
}: ResourceCardProps) => {
  return (
    <div
      data-testid={testId}
      className={cn(
        "group relative flex items-start gap-3 overflow-hidden rounded-xl border border-border bg-base-100 p-4 shadow-card",
        "transition-[background-color,border-color,box-shadow] duration-200 ease-out",
        "hover:border-base-content/25 hover:bg-base-content/[0.03] hover:shadow-card-hover",
      )}
    >
      {to && (
        <Link
          to={to}
          className="absolute inset-0 rounded-xl"
          aria-label={`Open ${label}`}
        />
      )}
      {typeIcon && (
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg border",
            cardBg,
            accentText,
          )}
        >
          {typeIcon}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 pr-9">
        {children}
      </div>
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-0.5 opacity-100 transition-all duration-150 focus-within:translate-x-0 focus-within:opacity-100 sm:translate-x-1 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
        <ResourceActions
          onEdit={onEdit}
          onDelete={onDelete}
          label={label}
          size="xs"
        />
      </div>
    </div>
  );
};
