import type { DragEndEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import type { TestPlanCase } from "@testcraft/types";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonStatus } from "@/components/ui/skeleton/SkeletonStatus";
import { PlanCaseRowSkeleton } from "@/features/testPlans/PlanCaseRowSkeleton";
import { SortablePlanCase } from "@/features/testPlans/SortablePlanCase";

interface PlanCasesPanelProps {
  sortedCases: TestPlanCase[];
  isPending: boolean;
  showSkeleton: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onReorder?: (cases: { test_case_id: string; order: number }[]) => void;
  onRemove?: (testCaseId: string) => void;
}

export const PlanCasesPanel = ({
  sortedCases,
  isPending,
  showSkeleton,
  isError,
  error,
  onRetry,
  onReorder,
  onRemove,
}: PlanCasesPanelProps) => {
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
      <EmptyState
        compact
        icon={<ClipboardDocumentListIcon className="size-5" />}
        title="No cases in this plan yet"
        description={
          onRemove
            ? "Add test cases from the right panel."
            : "This plan doesn't have any test cases yet."
        }
      />
    );
  }

  const caseIds = sortedCases.map((planCase) => planCase.test_case_id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!onReorder || !over || active.id === over.id) return;

    const oldIndex = sortedCases.findIndex(
      (planCase) => planCase.test_case_id === active.id,
    );
    const newIndex = sortedCases.findIndex(
      (planCase) => planCase.test_case_id === over.id,
    );
    const reordered = arrayMove(sortedCases, oldIndex, newIndex);

    onReorder(
      reordered.map((planCase, index) => ({
        test_case_id: planCase.test_case_id,
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
          {sortedCases.map((item, index) => (
            <SortablePlanCase
              key={item.test_case_id}
              item={item}
              position={index + 1}
              onRemove={onRemove}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};
