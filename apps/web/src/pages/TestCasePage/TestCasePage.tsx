import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
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
import { PlusIcon } from "@heroicons/react/24/solid";
import type {
  CreateTestCaseStep,
  TestCaseStep,
  UpdateTestCaseStep,
} from "@testcraft/types";
import { useMemo, useRef, useState } from "react";

import { ErrorState } from "@/components/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LabelBadge } from "@/components/ui/LabelBadge";
import { Modal } from "@/components/ui/Modal";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useModal } from "@/hooks/useModal";
import { useProject } from "@/hooks/useProjects";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import { useTestCase } from "@/hooks/useTestCases";
import {
  useBulkReorderSteps,
  useCreateTestCaseStep,
  useDeleteTestCaseStep,
  useTestCaseSteps,
  useUpdateTestCaseStep,
} from "@/hooks/useTestCaseSteps";
import { useTestSuite } from "@/hooks/useTestSuites";
import { LabelSelect } from "@/pages/TestCasePage/LabelSelect";
import { StepDragPreview } from "@/pages/TestCasePage/StepDragPreview";
import { StepForm } from "@/pages/TestCasePage/StepForm";
import { StepRow } from "@/pages/TestCasePage/StepRow";

export const TestCasePage = () => {
  const projectId = useRequiredParam("projectId");
  const suiteId = useRequiredParam("suiteId");
  const caseId = useRequiredParam("caseId");
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestCaseStep>();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localSteps, setLocalSteps] = useState<TestCaseStep[]>([]);
  const localStepsRef = useRef<TestCaseStep[]>([]);

  const { data: project } = useProject(projectId);
  const { data: suite } = useTestSuite(projectId, suiteId);
  const { data: testCase } = useTestCase(projectId, suiteId, caseId);
  const {
    data: steps,
    isPending,
    isError,
    error,
  } = useTestCaseSteps(projectId, suiteId, caseId);
  const createStep = useCreateTestCaseStep(projectId, suiteId, caseId);
  const updateStep = useUpdateTestCaseStep(projectId, suiteId, caseId);
  const bulkReorder = useBulkReorderSteps(projectId, suiteId, caseId);
  const deleteStep = useDeleteTestCaseStep(projectId, suiteId, caseId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { sortedSteps, nextOrder } = useMemo(() => {
    const sorted = [...(steps ?? [])].toSorted(
      (itemA, itemB) => itemA.order - itemB.order,
    );

    return {
      sortedSteps: sorted,
      nextOrder: sorted.length > 0 ? sorted.at(-1)!.order + 1 : 1,
    };
  }, [steps]);

  const displaySteps =
    activeId || bulkReorder.isPending ? localSteps : sortedSteps;
  const activeStep = activeId
    ? localSteps.find((step) => step.id === activeId)
    : null;

  const handleCreate = (input: CreateTestCaseStep) =>
    createStep.mutate(input, { onSuccess: close });
  const handleUpdate = (id: string) => (input: UpdateTestCaseStep) =>
    updateStep.mutate({ id, ...input }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteStep.mutate(id, { onSuccess: close });

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
      bulkReorder.mutate({ steps: reordered });
    }
  };

  useBreadcrumbs([
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}` },
    {
      label: suite?.name ?? "…",
      href: `/projects/${projectId}/suites/${suiteId}`,
    },
    { label: testCase?.name ?? "…" },
  ]);

  const deleteItem = modal.type === "delete" ? modal.item : null;

  const renderSteps = () => {
    if (isPending)
      return (
        <div className="flex min-h-80 items-center justify-center">
          <span className="loading loading-lg loading-spinner text-primary" />
        </div>
      );
    if (isError) return <ErrorState error={error} />;
    if (sortedSteps.length === 0)
      return (
        <EmptyState
          title="No steps defined"
          description="Break this test case down into clear, ordered steps."
        />
      );

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
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
                onEdit={() => openEdit(step)}
                onDelete={() => openDelete(step)}
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

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{testCase?.name}</h1>
          <p className="mt-0.5 text-sm text-base-content/70">
            {testCase?.description ?? "Steps for this test case"}
          </p>
          {testCase && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {(testCase.labels ?? []).map((label) => (
                <LabelBadge key={label.id} label={label} />
              ))}
              <LabelSelect
                projectId={projectId}
                suiteId={suiteId}
                caseId={caseId}
                assigned={testCase.labels ?? []}
              />
            </div>
          )}
        </div>
        <button
          className="btn shrink-0 btn-sm btn-primary"
          onClick={openCreate}
        >
          <PlusIcon className="size-4" aria-hidden="true" />
          Add Step
        </button>
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <div className="min-h-80">{renderSteps()}</div>
      </section>

      <Modal isOpen={modal.type === "create"} onClose={close} title="Add Step">
        {modal.type === "create" && (
          <StepForm
            nextOrder={nextOrder}
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createStep.isPending}
          />
        )}
      </Modal>
      <Modal isOpen={modal.type === "edit"} onClose={close} title="Edit Step">
        {modal.type === "edit" && (
          <StepForm
            key={modal.item.id}
            defaultValues={{
              order: modal.item.order,
              action: modal.item.action,
              expectedResult: modal.item.expectedResult,
            }}
            nextOrder={nextOrder}
            onSubmit={handleUpdate(modal.item.id)}
            onCancel={close}
            isLoading={updateStep.isPending}
          />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={modal.type === "delete"}
        onClose={close}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        title="Delete Step"
        description={
          deleteItem
            ? `Delete step ${deleteItem.order}? This cannot be undone.`
            : ""
        }
        isLoading={deleteStep.isPending}
      />
    </div>
  );
};
