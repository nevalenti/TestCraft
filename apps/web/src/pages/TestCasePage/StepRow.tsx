import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon } from "@heroicons/react/24/solid";
import type { TestCaseStep } from "@testcraft/types";

import { ResourceActions } from "@/components/ui/ResourceActions";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

interface StepRowProps {
  step: TestCaseStep;
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
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <div
        data-testid="step-row"
        className={cn(
          "card-bg-info group relative rounded-lg border shadow-md transition-shadow duration-200",
          isDragging
            ? "border-dashed border-primary/30 !shadow-none"
            : "border-base-content/20 hover:shadow-xl",
        )}
      >
        <div className={cn(isDragging && "invisible")}>
          <div className="flex items-start gap-3 p-4 pr-24">
            <div className="flex shrink-0 items-center pt-0.5">
              <span className="flex size-8 items-center justify-center rounded-md bg-base-content/10 text-sm font-bold text-base-content tabular-nums">
                {step.order}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-base-content/50 uppercase">
                    Action
                  </p>
                  <p className="text-sm leading-relaxed text-base-content/90">
                    {step.action}
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-base-content/50 uppercase">
                    Expected Result
                  </p>
                  <p className="text-sm leading-relaxed text-base-content/90">
                    {step.expectedResult}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-base-content/40 tabular-nums">
                {formatDate(step.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-1/2 right-2.5 z-10 flex -translate-y-1/2 items-center gap-1">
          <div className="flex flex-col gap-1 opacity-100 transition-opacity duration-150 focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
            <ResourceActions
              onEdit={onEdit}
              onDelete={onDelete}
              label="step"
              size="xs"
            />
          </div>
          <button
            {...attributes}
            {...listeners}
            className="btn cursor-grab touch-none btn-ghost btn-sm active:cursor-grabbing"
            aria-label="Drag to reorder step"
          >
            <Bars3Icon className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
