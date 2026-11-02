import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon, TrashIcon } from "@heroicons/react/24/solid";
import type { TestPlanCase } from "@testcraft/types";

interface SortablePlanCaseProps {
  item: TestPlanCase;
  position: number;
  onRemove?: (id: string) => void;
}

export const SortablePlanCase = ({
  item,
  position,
  onRemove,
}: SortablePlanCaseProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.test_case_id, disabled: !onRemove });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-border bg-base-100 px-4 py-2.5"
    >
      {onRemove && (
        <button
          className="cursor-grab touch-none text-fg-subtle hover:text-base-content"
          {...listeners}
          {...attributes}
          aria-label="Drag to reorder"
        >
          <Bars3Icon className="size-4" />
        </button>
      )}
      <span className="w-5 text-right text-xs text-fg-muted tabular-nums">
        {position}
      </span>
      <span className="flex-1 text-sm font-medium">{item.test_case_name}</span>
      {onRemove && (
        <button
          className="btn text-fg-subtle btn-ghost btn-xs hover:bg-error/10 hover:text-error"
          onClick={() => onRemove(item.test_case_id)}
          aria-label="Remove from plan"
        >
          <TrashIcon className="size-3.5" />
        </button>
      )}
    </li>
  );
};
