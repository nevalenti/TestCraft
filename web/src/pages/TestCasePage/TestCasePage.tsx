import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProject } from "@/hooks/useProjects";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import { useTestCase } from "@/hooks/useTestCases";
import {
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

  const { data: project } = useProject(projectId);
  const { data: suite } = useTestSuite(projectId, suiteId);
  const { data: testCase } = useTestCase(projectId, suiteId, caseId);
  const { data: steps, isPending } = useTestCaseSteps(
    projectId,
    suiteId,
    caseId,
  );
  const createStep = useCreateTestCaseStep(projectId, suiteId, caseId);
  const updateStep = useUpdateTestCaseStep(projectId, suiteId, caseId);
  const deleteStep = useDeleteTestCaseStep(projectId, suiteId, caseId);
  const close = () => setModal({ type: "closed" });

  const { sortedSteps, nextOrder } = useMemo(() => {
    const sorted = [...(steps ?? [])].sort((a, b) => a.order - b.order);
    return {
      sortedSteps: sorted,
      nextOrder: sorted.length > 0 ? sorted[sorted.length - 1].order + 1 : 1,
    };
  }, [steps]);

  const handleCreate = (dto: CreateTestCaseStepDto) =>
    createStep.mutate(dto, { onSuccess: close });
  const handleUpdate = (id: string) => (dto: UpdateTestCaseStepDto) =>
    updateStep.mutate({ id, ...dto }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteStep.mutate(id, { onSuccess: close });

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
    <div className="w-full flex flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            {testCase?.name}
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            {testCase?.description ?? "Steps for this test case"}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm shrink-0"
          onClick={() => setModal({ type: "create" })}
        >
          Add Step
        </button>
      </header>

      <section className="page-content flex-1">
        <div className="min-h-80">
          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <SkeletonCard key={i} />
              ))}
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
                  Add First Step
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {sortedSteps.map((step) => (
                <StepRow
                  key={step.id}
                  step={step}
                  onEdit={() => setModal({ type: "edit", item: step })}
                  onDelete={() => setModal({ type: "delete", item: step })}
                />
              ))}
            </div>
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
        description={deleteItem ? `Delete step ${deleteItem.order}?` : ""}
        isLoading={deleteStep.isPending}
      />
    </div>
  );
};
