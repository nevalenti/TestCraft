import { PencilIcon, TrashIcon } from "./icons";

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
      className={`btn btn-ghost btn-${size}`}
      onClick={onEdit}
      aria-label={`Edit ${label}`}
    >
      <PencilIcon size={size === "xs" ? "size-3.5" : undefined} />
    </button>
    <button
      className={`btn btn-ghost btn-${size} text-error`}
      onClick={onDelete}
      aria-label={`Delete ${label}`}
    >
      <TrashIcon size={size === "xs" ? "size-3.5" : undefined} />
    </button>
  </>
);
