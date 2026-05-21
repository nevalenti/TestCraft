import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon } from "@heroicons/react/24/outline";

import { ResourceActions } from "@/components/ui/ResourceActions";
import { formatDate } from "@/lib/format";
import type { TestCaseStepDto } from "@/types";

interface StepRowProps {
  step: TestCaseStepDto;
  onEdit: () => void;
  onDelete: () => void;
}

export const StepRow = ({ step, onEdit, onDelete }: StepRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="relative card-bg-primary border border-border rounded-lg p-5 shadow-md group transition-shadow duration-200 hover:shadow-xl"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <button
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing text-base-content/30 hover:text-base-content/60 transition-colors"
            aria-label="Drag to reorder step"
          >
            <Bars3Icon className="size-4" aria-hidden="true" />
          </button>
          <span className="flex size-6 items-center justify-center rounded bg-base-content/10 text-base-content/70 text-[11px] font-bold tabular-nums shrink-0">
            {step.order}
          </span>
          <span className="text-xs font-semibold text-base-content/60">
            Step
          </span>
        </div>
        <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
          <ResourceActions onEdit={onEdit} onDelete={onDelete} label="step" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold text-base-content/50 mb-1.5 uppercase tracking-wider">
            Action
          </p>
          <p className="text-sm leading-relaxed text-base-content/90">
            {step.action}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-base-content/50 mb-1.5 uppercase tracking-wider">
            Expected Result
          </p>
          <p className="text-sm leading-relaxed text-base-content/90">
            {step.expectedResult}
          </p>
        </div>
      </div>
      <p className="text-base-content/45 mt-4 text-xs tabular-nums">
        {formatDate(step.createdAt)}
      </p>
    </div>
  );
};
