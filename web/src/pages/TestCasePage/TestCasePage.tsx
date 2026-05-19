import { useMemo, useState } from "react";
import { useParams } from "react-router";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProject } from "@/hooks/useProjects";
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
  const { projectId, suiteId, caseId } = useParams<{
    projectId: string;
    suiteId: string;
    caseId: string;
  }>();
  const [modal, setModal] = useState<ModalState<TestCaseStepDto>>({
    type: "closed",
  });

  const { data: project } = useProject(projectId!);
  const { data: suite } = useTestSuite(projectId!, suiteId!);
  const { data: testCase } = useTestCase(projectId!, suiteId!, caseId!);
  const { data: steps, isPending } = useTestCaseSteps(
    projectId!,
    suiteId!,
    caseId!,
  );
  const createStep = useCreateTestCaseStep(projectId!, suiteId!, caseId!);
  const updateStep = useUpdateTestCaseStep(projectId!, suiteId!, caseId!);
  const deleteStep = useDeleteTestCaseStep(projectId!, suiteId!, caseId!);
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

  return (
    <div className="w-full flex flex-col">
      <header className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {testCase?.name}
          </h1>
          {testCase?.description && (
            <p className="mt-0.5 text-sm text-base-content/45">
              {testCase.description}
            </p>
          )}
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
              {[0, 1, 2].map((i) => (
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
                  Add Step
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
        <StepForm
          nextOrder={nextOrder}
          onSubmit={handleCreate}
          onCancel={close}
          isLoading={createStep.isPending}
        />
      </Modal>
      {modal.type === "edit" && (
        <Modal isOpen onClose={close} title="Edit Step">
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
        </Modal>
      )}
      {modal.type === "delete" && (
        <ConfirmDialog
          isOpen
          onClose={close}
          onConfirm={() => handleDelete(modal.item.id)}
          title="Delete Step"
          description={`Delete step ${modal.item.order}?`}
          isLoading={deleteStep.isPending}
        />
      )}
    </div>
  );
};
