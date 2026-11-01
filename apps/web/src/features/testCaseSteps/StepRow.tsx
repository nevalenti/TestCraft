import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars2Icon } from "@heroicons/react/24/solid";
import type { TestCaseStep } from "@testcraft/types";

import { ResourceActions } from "@/components/ui/resource/ResourceActions";
import { StepFields } from "@/features/testCaseSteps/StepFields";
import { cn } from "@/lib/cn";

interface StepRowProps {
  step: TestCaseStep;
  onEdit?: () => void;
  onDelete?: () => void;
  reorderable?: boolean;
}

export const StepRow = ({
  step,
  onEdit,
  onDelete,
  reorderable = true,
}: StepRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, disabled: !reorderable });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <div
        data-testid="step-row"
        className={cn(
          "group flex items-start gap-3 rounded-xl border p-4 transition-colors",
          isDragging
            ? "border-dashed border-primary/40 bg-transparent"
            : "border-border bg-base-100 hover:border-base-content/25",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-1 items-start gap-3",
            isDragging && "invisible",
          )}
        >
          {reorderable && (
            <button
              {...attributes}
              {...listeners}
              className="btn -ml-1.5 btn-square cursor-grab touch-none text-fg-subtle btn-ghost btn-xs hover:text-base-content active:cursor-grabbing"
              aria-label="Drag to reorder step"
            >
              <Bars2Icon className="size-4" aria-hidden="true" />
            </button>
          )}
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-base-content/8 text-xs font-bold text-fg-secondary tabular-nums">
            {step.order}
          </span>
          <div className="min-w-0 flex-1">
            <StepFields
              action={step.action}
              expectedResult={step.expected_result}
            />
          </div>
          {(onEdit || onDelete) && (
            <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              <ResourceActions
                onEdit={onEdit}
                onDelete={onDelete}
                label="step"
                size="xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
