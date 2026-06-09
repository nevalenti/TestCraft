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
      "relative group overflow-hidden rounded-lg border border-base-content/20 shadow-md transition-shadow duration-200 hover:shadow-xl motion-safe:transition-all motion-safe:hover:-translate-y-0.5",
      cardBg,
    )}
  >
    {to && (
      <Link
        to={to}
        className="absolute inset-0 rounded-lg"
        aria-label={`Open ${label}`}
      />
    )}
    <div className="flex min-h-[120px] flex-col justify-between p-4 pr-10">
      {typeIcon && (
        <div
          className={cn("mb-3 flex items-center gap-1.5 font-bold", accentText)}
        >
          {typeIcon}
          <span className="text-[11px] tracking-[0.08em] uppercase">
            {label}
          </span>
        </div>
      )}
      {children}
    </div>
    <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 opacity-100 transition-all duration-150 focus-within:translate-x-0 focus-within:opacity-100 sm:translate-x-2 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
      <ResourceActions onEdit={onEdit} onDelete={onDelete} label={label} />
    </div>
  </div>
);
