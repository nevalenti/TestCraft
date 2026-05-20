import { ResourceActions } from "./ResourceActions";

interface ResourceListRowProps {
  children: React.ReactNode;
  date?: string;
  onEdit: () => void;
  onDelete: () => void;
  label: string;
}

export const ResourceListRow = ({
  children,
  date,
  onEdit,
  onDelete,
  label,
}: ResourceListRowProps) => (
  <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border/70 last:border-b-0 border-l-4 border-l-primary bg-base-100 group hover:bg-base-200/50 transition-colors duration-150">
    <div className="flex-1 min-w-0">{children}</div>
    <div className="flex items-center gap-3 shrink-0">
      {date && (
        <span className="text-xs text-base-content/45 tabular-nums hidden sm:block">
          {date}
        </span>
      )}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <ResourceActions
          onEdit={onEdit}
          onDelete={onDelete}
          label={label}
          size="xs"
        />
      </div>
    </div>
  </div>
);
