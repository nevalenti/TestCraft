import { DndContext, DragOverlay } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { TestCaseStep } from '@testcraft/types';

import { StepDragPreview } from '@/pages/TestCasePage/StepDragPreview';
import { StepRow } from '@/pages/TestCasePage/StepRow';
import { useStepReorder } from '@/pages/TestCasePage/useStepReorder';

export const StepsList = ({
  sortedSteps,
  isReordering,
  onReorder,
  onEdit,
  onDelete,
}: {
  sortedSteps: TestCaseStep[];
  isReordering: boolean;
  onReorder: (steps: { id: string; order: number }[]) => void;
  onEdit: (step: TestCaseStep) => void;
  onDelete: (step: TestCaseStep) => void;
}) => {
  const {
    sensors,
    collisionDetection,
    displaySteps,
    activeStep,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useStepReorder(sortedSteps, onReorder, isReordering);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
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
              onEdit={() => onEdit(step)}
              onDelete={() => onDelete(step)}
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
