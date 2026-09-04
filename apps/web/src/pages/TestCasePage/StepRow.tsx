import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon } from '@heroicons/react/24/solid';
import type { TestCaseStep } from '@testcraft/types';

import { ResourceActions } from '@/components/ui/ResourceActions';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { StepFields } from '@/pages/TestCasePage/StepFields';

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
        style={{ '--card-glow': 'var(--color-info)' } as React.CSSProperties}
        className={cn(
          'card-bg-info group relative rounded-lg border transition-[box-shadow] duration-200 ease-out',
          isDragging
            ? 'border-dashed border-primary/30 shadow-none'
            : 'border-base-content/20 shadow-card hover:shadow-[0_0_0_1px_oklch(from_var(--card-glow)_l_c_h/0.55),0_0_6px_0px_oklch(from_var(--card-glow)_l_c_h/0.2)]',
        )}
      >
        <div className={cn(isDragging && 'invisible')}>
          {/* pr-24 reserves space for the edit/delete buttons and drag handle pinned to the right edge */}
          <div className="flex items-start gap-3 p-4 pr-24">
            <div className="flex shrink-0 items-center pt-0.5">
              <span className="flex size-8 items-center justify-center rounded-md bg-base-content/10 text-sm font-bold text-base-content tabular-nums">
                {step.order}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-3">
                <StepFields
                  action={step.action}
                  expectedResult={step.expectedResult}
                />
              </div>
              <p className="text-xs text-base-content/55 tabular-nums">
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
