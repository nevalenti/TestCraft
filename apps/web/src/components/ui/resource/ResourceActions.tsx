import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/cn";

const SIZE_CLASS = {
  sm: { button: "btn-sm", icon: "size-4" },
  xs: { button: "btn-xs", icon: "size-3.5" },
} as const;

interface ResourceActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  label: string;
  size?: "sm" | "xs";
}

export const ResourceActions = ({
  onEdit,
  onDelete,
  label,
  size = "sm",
}: ResourceActionsProps) => {
  const sizeClass = SIZE_CLASS[size];

  return (
    <>
      {onEdit && (
        <button
          className={cn(
            "btn btn-ghost text-fg-muted hover:text-base-content",
            sizeClass.button,
          )}
          onClick={onEdit}
          aria-label={`Edit ${label}`}
        >
          <PencilIcon className={sizeClass.icon} />
        </button>
      )}
      {onDelete && (
        <button
          className={cn(
            "btn btn-ghost text-fg-muted hover:text-error",
            sizeClass.button,
          )}
          onClick={onDelete}
          aria-label={`Delete ${label}`}
        >
          <TrashIcon className={sizeClass.icon} />
        </button>
      )}
    </>
  );
};
