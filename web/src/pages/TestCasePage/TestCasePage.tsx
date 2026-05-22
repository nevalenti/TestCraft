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
import { useMemo, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
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
import type {
  CreateTestCaseStepDto,
  ModalState,
  TestCaseStepDto,
  UpdateTestCaseStepDto,
} from "@/types";

import { StepForm } from "./StepForm";
import { StepRow } from "./StepRow";

export const TestCasePage = () => {
  const projectId = useRequiredParam("projectId");
  const suiteId = useRequiredParam("suiteId");
  const caseId = useRequiredParam("caseId");
  const [modal, setModal] = useState<ModalState<TestCaseStepDto>>({
    type: "closed",
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localSteps, setLocalSteps] = useState<TestCaseStepDto[]>([]);
  const localStepsRef = useRef<TestCaseStepDto[]>([]);

  const { data: project } = useProject(projectId);
  const { data: suite } = useTestSuite(projectId, suiteId);
  const { data: testCase } = useTestCase(projectId, suiteId, caseId);
  const {
    data: steps,
    isPending,
    isError,
  } = useTestCaseSteps(projectId, suiteId, caseId);
  const createStep = useCreateTestCaseStep(projectId, suiteId, caseId);
  const updateStep = useUpdateTestCaseStep(projectId, suiteId, caseId);
  const bulkReorder = useBulkReorderSteps(projectId, suiteId, caseId);
  const deleteStep = useDeleteTestCaseStep(projectId, suiteId, caseId);
  const close = () => setModal({ type: "closed" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { sortedSteps, nextOrder } = useMemo(() => {
    const sorted = [...(steps ?? [])].sort((a, b) => a.order - b.order);
    return {
      sortedSteps: sorted,
      nextOrder: sorted.length > 0 ? sorted[sorted.length - 1].order + 1 : 1,
    };
  }, [steps]);

  const displaySteps = activeId ? localSteps : sortedSteps;
  const activeStep = activeId
    ? localSteps.find((s) => s.id === activeId)
    : null;

  const handleCreate = (dto: CreateTestCaseStepDto) =>
    createStep.mutate(dto, { onSuccess: close });
  const handleUpdate = (id: string) => (dto: UpdateTestCaseStepDto) =>
    updateStep.mutate({ id, ...dto }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteStep.mutate(id, { onSuccess: close });

  const handleDragStart = ({ active }: DragStartEvent) => {
    localStepsRef.current = sortedSteps;
    setActiveId(active.id as string);
    setLocalSteps(sortedSteps);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return;
    const prev = localStepsRef.current;
    const oldIndex = prev.findIndex((s) => s.id === active.id);
    const newIndex = prev.findIndex((s) => s.id === over.id);
    const next = arrayMove(prev, oldIndex, newIndex);
    localStepsRef.current = next;
    setLocalSteps(next);
  };

  const handleDragEnd = ({ over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const reordered = localStepsRef.current.map((step, index) => ({
      id: step.id,
      order: index + 1,
    }));
    const hasChanges = reordered.some(({ id, order }) => {
      const original = sortedSteps.find((s) => s.id === id);
      return original?.order !== order;
    });

    if (hasChanges) {
      bulkReorder.mutate({ steps: reordered });
    }
  };

  useBreadcrumbs([
    { label: "home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}` },
    {
      label: suite?.name ?? "…",
      href: `/projects/${projectId}/suites/${suiteId}`,
    },
    { label: testCase?.name ?? "…" },
  ]);

  const deleteItem = modal.type === "delete" ? modal.item : null;

  return (
    <div className="w-full flex flex-col min-h-0">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            {testCase?.name ?? (
              <span className="skeleton inline-block w-48 h-[0.75em] rounded align-middle" />
            )}
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            {testCase?.description ?? "Steps for this test case"}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm shrink-0"
          onClick={() => setModal({ type: "create" })}
        >
          <PlusIcon className="size-4" />
          Add Step
        </button>
      </header>

      <section className="page-content flex-1 overflow-y-auto min-h-0">
        <div className="min-h-80">
          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-error font-semibold mb-2">Failed to load</p>
                <p className="text-base-content/60 text-sm mb-4">
                  Please check your connection and try again.
                </p>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : sortedSteps.length === 0 ? (
            <EmptyState
              title="No steps defined"
              description="Break this test case down into clear, ordered steps."
              action={
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setModal({ type: "create" })}
                >
                  <PlusIcon className="size-4" />
                  Add First Step
                </button>
              }
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={displaySteps.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {displaySteps.map((step) => (
                    <StepRow
                      key={step.id}
                      step={step}
                      onEdit={() => setModal({ type: "edit", item: step })}
                      onDelete={() => setModal({ type: "delete", item: step })}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
                {activeStep && (
                  <div className="card-bg-info border border-border rounded-lg p-4 shadow-2xl ring-1 ring-primary/20 cursor-grabbing rotate-[0.5deg]">
                    <div className="flex items-center gap-2.5 mb-4">
                      <span className="flex size-6 items-center justify-center rounded bg-base-content/10 text-base-content/70 text-[11px] font-bold tabular-nums shrink-0">
                        {activeStep.order}
                      </span>
                      <span className="text-xs font-semibold text-base-content/60">
                        Step
                      </span>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-semibold text-base-content/50 mb-1.5 uppercase tracking-wider">
                          Action
                        </p>
                        <p className="text-sm leading-relaxed text-base-content/90">
                          {activeStep.action}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-base-content/50 mb-1.5 uppercase tracking-wider">
                          Expected Result
                        </p>
                        <p className="text-sm leading-relaxed text-base-content/90">
                          {activeStep.expectedResult}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
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
