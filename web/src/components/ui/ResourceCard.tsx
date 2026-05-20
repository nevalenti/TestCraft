import { ResourceActions } from "./ResourceActions";

interface ResourceCardProps {
  onEdit: () => void;
  onDelete: () => void;
  label: string;
  children: React.ReactNode;
}

export const ResourceCard = ({
  onEdit,
  onDelete,
  label,
  children,
}: ResourceCardProps) => (
  <div className="relative bg-base-100 border border-border/80 border-l-4 border-l-primary shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group overflow-hidden">
    <div className="p-5 pr-12 flex flex-col justify-between min-h-full">
      {children}
    </div>
    <div className="absolute top-3 right-3 flex flex-col gap-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150">
      <ResourceActions onEdit={onEdit} onDelete={onDelete} label={label} />
    </div>
  </div>
);
