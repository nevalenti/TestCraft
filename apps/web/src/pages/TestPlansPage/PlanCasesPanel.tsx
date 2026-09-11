import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { TestPlanCase } from '@testcraft/types';

import { ErrorState } from '@/components/ErrorState';
import { SkeletonStatus } from '@/components/ui/SkeletonStatus';
import { PlanCaseRowSkeleton } from '@/pages/TestPlansPage/PlanCaseRowSkeleton';
import { SortableItem } from '@/pages/TestPlansPage/SortableItem';

export const PlanCasesPanel = ({
  sortedCases,
  isPending,
  showSkeleton,
  isError,
  error,
  onRetry,
  onReorder,
  onRemove,
}: {
  sortedCases: TestPlanCase[];
  isPending: boolean;
  showSkeleton: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onReorder: (cases: { testCaseId: string; order: number }[]) => void;
  onRemove: (testCaseId: string) => void;
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  if (isPending) {
    return (
      showSkeleton && (
        <SkeletonStatus label="Loading plan cases…">
          <ul className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <PlanCaseRowSkeleton key={i} />
            ))}
          </ul>
        </SkeletonStatus>
      )
    );
  }
  if (isError) return <ErrorState error={error} onRetry={onRetry} />;
  if (sortedCases.length === 0) {
    return (
      <p className="text-sm text-base-content/65">
        Add test cases from the right panel.
      </p>
    );
  }

  const caseIds = sortedCases.map((planCase) => planCase.testCaseId);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const oldIndex = sortedCases.findIndex(
      (planCase) => planCase.testCaseId === active.id,
    );
    const newIndex = sortedCases.findIndex(
      (planCase) => planCase.testCaseId === over.id,
    );
    const reordered = arrayMove(sortedCases, oldIndex, newIndex);

    onReorder(
      reordered.map((planCase, index) => ({
        testCaseId: planCase.testCaseId,
        order: index + 1,
      })),
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={caseIds} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {sortedCases.map((item) => (
            <SortableItem
              key={item.testCaseId}
              item={item}
              onRemove={onRemove}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};
