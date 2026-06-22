import { Link } from "@tanstack/react-router";

import { ResourceActions } from "@/components/ui/ResourceActions";
import { cn } from "@/lib/cn";

interface ResourceCardProps {
  to?: string;
  onEdit: () => void;
  onDelete: () => void;
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
  cardBg = "bg-base-100",
  accentText = "text-primary",
  typeIcon,
  testId,
  children,
}: ResourceCardProps) => (
  <div
    data-testid={testId}
    className={cn(
      "group relative overflow-hidden rounded-xl border border-base-content/15 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px",
      cardBg,
    )}
  >
    {to && (
      <Link
        to={to}
        className="absolute inset-0 rounded-xl"
        aria-label={`Open ${label}`}
      />
    )}
    <div className="flex min-h-[120px] flex-col justify-between p-4 pr-10">
      {typeIcon && (
        <div className="mb-3 flex items-center gap-1.5">
          <span className={accentText}>{typeIcon}</span>
          <span className="text-[11px] font-semibold tracking-[0.08em] text-base-content/40 uppercase">
            {label}
          </span>
        </div>
      )}
      {children}
    </div>
    <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 opacity-100 transition-all duration-150 focus-within:translate-x-0 focus-within:opacity-100 sm:translate-x-2 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
      <ResourceActions
        onEdit={onEdit}
        onDelete={onDelete}
        label={label}
        size="xs"
      />
    </div>
  </div>
);
