import { Link } from "react-router";

import { ResourceActions } from "./ResourceActions";

interface ResourceCardProps {
  to?: string;
  onEdit: () => void;
  onDelete: () => void;
  label: string;
  cardBg?: string;
  accentText?: string;
  typeIcon?: React.ReactNode;
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
  children,
}: ResourceCardProps) => (
  <div
    className={`relative ${cardBg} border border-base-content/20 rounded-lg shadow-md transition-shadow duration-200 hover:shadow-xl motion-safe:hover:-translate-y-0.5 motion-safe:transition-all group overflow-hidden`}
  >
    {to && (
      <Link
        to={to}
        className="absolute inset-0 rounded-lg"
        aria-label={`Open ${label}`}
      />
    )}
    <div className="p-5 pr-10 flex flex-col justify-between min-h-[120px]">
      {typeIcon && (
        <div
          className={`flex items-center gap-1.5 mb-3 ${accentText} font-bold`}
        >
          {typeIcon}
          <span className="text-[11px] uppercase tracking-[0.08em]">
            {label}
          </span>
        </div>
      )}
      {children}
    </div>
    <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 opacity-100 sm:opacity-0 sm:translate-x-2 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 focus-within:opacity-100 focus-within:translate-x-0 transition-all duration-150">
      <ResourceActions onEdit={onEdit} onDelete={onDelete} label={label} />
    </div>
  </div>
);
