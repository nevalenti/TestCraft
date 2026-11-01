import { DndContext, DragOverlay } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { TestCaseStep } from "@testcraft/types";

import { StepDragPreview } from "@/features/testCaseSteps/StepDragPreview";
import { StepRow } from "@/features/testCaseSteps/StepRow";
import { useStepReorder } from "@/features/testCaseSteps/useStepReorder";

const noReorder = () => {};

interface StepsListProps {
  sortedSteps: TestCaseStep[];
  isReordering: boolean;
  onReorder?: (steps: { id: string; order: number }[]) => void;
  onEdit?: (step: TestCaseStep) => void;
  onDelete?: (step: TestCaseStep) => void;
}

export const StepsList = ({
  sortedSteps,
  isReordering,
  onReorder,
  onEdit,
  onDelete,
}: StepsListProps) => {
  const {
    sensors,
    collisionDetection,
    displaySteps,
    activeStep,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useStepReorder(sortedSteps, onReorder ?? noReorder, isReordering);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={displaySteps.map((step) => step.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {displaySteps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              onEdit={onEdit && (() => onEdit(step))}
              onDelete={onDelete && (() => onDelete(step))}
              reorderable={!!onReorder}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeStep && <StepDragPreview step={activeStep} />}
      </DragOverlay>
    </DndContext>
  );
};
