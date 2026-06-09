import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/cn";

interface ResourceActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  label: string;
  size?: "sm" | "xs";
}

export const ResourceActions = ({
  onEdit,
  onDelete,
  label,
  size = "sm",
}: ResourceActionsProps) => (
  <>
    <button
      className={cn("btn btn-ghost", `btn-${size}`)}
      onClick={onEdit}
      aria-label={`Edit ${label}`}
    >
      <PencilIcon className={cn(size === "xs" ? "size-3.5" : "size-4")} />
    </button>
    <button
      className={cn("btn btn-ghost text-error", `btn-${size}`)}
      onClick={onDelete}
      aria-label={`Delete ${label}`}
    >
      <TrashIcon className={cn(size === "xs" ? "size-3.5" : "size-4")} />
    </button>
  </>
);
