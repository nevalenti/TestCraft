import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon, TrashIcon } from '@heroicons/react/24/solid';
import type { TestPlanCase } from '@testcraft/types';

interface SortableItemProps {
  item: TestPlanCase;
  onRemove: (id: string) => void;
}

export const SortableItem = ({ item, onRemove }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.testCaseId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-border bg-base-100 px-4 py-3"
    >
      <button
        className="cursor-grab touch-none text-base-content/55 hover:text-base-content/85"
        {...listeners}
        {...attributes}
        aria-label="Drag to reorder"
      >
        <Bars3Icon className="size-4" />
      </button>
      <span className="w-5 text-right text-xs text-base-content/65 tabular-nums">
        {item.order}
      </span>
      <span className="flex-1 text-sm font-medium">{item.testCaseName}</span>
      <button
        className="btn text-error btn-ghost btn-xs"
        onClick={() => onRemove(item.testCaseId)}
        aria-label="Remove from plan"
      >
        <TrashIcon className="size-3.5" />
      </button>
    </li>
  );
};
