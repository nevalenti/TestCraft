import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon } from "@heroicons/react/24/solid";
import type { TestCaseStep } from "@testcraft/types";

import { ResourceActions } from "@/components/ui/ResourceActions";
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
        className={`relative card-bg-info border rounded-lg shadow-md group transition-shadow duration-200 ${
          isDragging
            ? "border-dashed border-primary/30 !shadow-none"
            : "border-base-content/20 hover:shadow-xl"
        }`}
      >
        <div className={isDragging ? "invisible" : undefined}>
          <div className="flex items-start gap-3 p-4 pr-24">
            <div className="flex items-center shrink-0 pt-0.5">
              <span className="flex size-8 items-center justify-center rounded-md bg-base-content/10 text-base-content text-sm font-bold tabular-nums">
                {step.order}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="grid gap-4 sm:grid-cols-2 mb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-base-content/50 mb-1.5">
                    Action
                  </p>
                  <p className="text-sm leading-relaxed text-base-content/90">
                    {step.action}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-base-content/50 mb-1.5">
                    Expected Result
                  </p>
                  <p className="text-sm leading-relaxed text-base-content/90">
                    {step.expectedResult}
                  </p>
                </div>
              </div>
              <p className="text-[11px] tabular-nums text-base-content/40">
                {formatDate(step.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-2.5 z-10 flex items-center gap-1">
          <div className="flex flex-col gap-1">
            <ResourceActions onEdit={onEdit} onDelete={onDelete} label="step" />
          </div>
          <button
            {...attributes}
            {...listeners}
            className="btn btn-link btn-md touch-none cursor-grab active:cursor-grabbing text-base-content"
            aria-label="Drag to reorder step"
          >
            <Bars3Icon className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
