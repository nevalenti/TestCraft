import {
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { TestCaseStep } from '@testcraft/types';
import { useRef, useState } from 'react';

export const useStepReorder = (
  sortedSteps: TestCaseStep[],
  onReorder: (steps: { id: string; order: number }[]) => void,
  isReordering: boolean,
) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localSteps, setLocalSteps] = useState<TestCaseStep[]>([]);
  const localStepsRef = useRef<TestCaseStep[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const displaySteps = activeId || isReordering ? localSteps : sortedSteps;
  const activeStep = activeId
    ? localSteps.find((step) => step.id === activeId)
    : null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    localStepsRef.current = sortedSteps;
    setActiveId(active.id as string);
    setLocalSteps(sortedSteps);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return;

    const previousSteps = localStepsRef.current;
    const oldIndex = previousSteps.findIndex((step) => step.id === active.id);
    const newIndex = previousSteps.findIndex((step) => step.id === over.id);

    localStepsRef.current = arrayMove(previousSteps, oldIndex, newIndex);
  };

  const handleDragEnd = ({ over }: DragEndEvent) => {
    const finalSteps = localStepsRef.current;

    setLocalSteps(finalSteps);
    setActiveId(null);
    if (!over) return;

    const reordered = finalSteps.map((step, index) => ({
      id: step.id,
      order: index + 1,
    }));

    const hasChanges = reordered.some(({ id, order }) => {
      const original = sortedSteps.find((step) => step.id === id);

      return original?.order !== order;
    });

    if (hasChanges) {
      onReorder(reordered);
    }
  };

  return {
    sensors,
    collisionDetection: closestCenter,
    displaySteps,
    activeStep,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};
