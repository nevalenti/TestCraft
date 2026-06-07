import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

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
      <PencilIcon className={size === "xs" ? "size-3.5" : "size-4"} />
    </button>
    <button
      className={`btn btn-ghost btn-${size} text-error`}
      onClick={onDelete}
      aria-label={`Delete ${label}`}
    >
      <TrashIcon className={size === "xs" ? "size-3.5" : "size-4"} />
    </button>
  </>
);
