import { PencilIcon, TrashIcon } from "./icons";

interface ResourceCardProps {
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export const ResourceCard = ({
  onEdit,
  onDelete,
  children,
}: ResourceCardProps) => (
  <div className="relative bg-base-100 border border-border border-l-4 border-l-primary shadow-sm transition-all duration-150 hover:shadow-md group overflow-hidden">
    <div className="p-5 flex flex-row gap-4 items-stretch">
      <div className="flex-1 flex flex-col gap-2 min-w-0">{children}</div>
      <div className="flex shrink-0 flex-col justify-between gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="btn btn-ghost btn-sm"
          onClick={onEdit}
          aria-label="Edit"
        >
          <PencilIcon />
        </button>
        <button
          className="btn btn-ghost btn-sm text-error"
          onClick={onDelete}
          aria-label="Delete"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  </div>
);
