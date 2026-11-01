import { PencilIcon, PlusIcon } from "@heroicons/react/24/solid";
import { getRouteApi } from "@tanstack/react-router";
import type {
  CreateTestCaseStep,
  TestCaseStep,
  UpdateTestCaseStep,
} from "@testcraft/types";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LabelBadge } from "@/components/ui/LabelBadge";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { SkeletonStatus } from "@/components/ui/skeleton/SkeletonStatus";
import { LabelSelect } from "@/features/labels/LabelSelect";
import { useProject } from "@/features/projects/hooks";
import { useProjectPermissions } from "@/features/projects/permissions";
import { CaseForm } from "@/features/testCases/CaseForm";
import { useTestCase, useUpdateTestCase } from "@/features/testCases/hooks";
import { PriorityBadge } from "@/features/testCases/PriorityBadge";
import {
  useCreateTestCaseStep,
  useDeleteTestCaseStep,
  useReorderTestCaseSteps,
  useTestCaseSteps,
  useUpdateTestCaseStep,
} from "@/features/testCaseSteps/hooks";
import { StepForm } from "@/features/testCaseSteps/StepForm";
import { StepRowSkeleton } from "@/features/testCaseSteps/StepRowSkeleton";
import { StepsList } from "@/features/testCaseSteps/StepsList";
import { useTestSuite } from "@/features/testSuites/hooks";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";
import { useModal } from "@/hooks/useModal";

const routeApi = getRouteApi(
  "/_app/projects/$projectId_/suites_/$suiteId_/cases/$caseId",
);

export const CasePage = () => {
  const { projectId, suiteId, caseId } = routeApi.useParams();
  const { canEdit } = useProjectPermissions(projectId);
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestCaseStep>();

  const { data: project } = useProject(projectId);
  const { data: suite } = useTestSuite(projectId, suiteId);
  const { data: testCase } = useTestCase(projectId, suiteId, caseId);
  const updateCase = useUpdateTestCase(projectId, suiteId);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const {
    data: steps,
    isPending,
    isError,
    error,
    refetch,
  } = useTestCaseSteps(projectId, suiteId, caseId);
  const createStep = useCreateTestCaseStep(projectId, suiteId, caseId);
  const updateStep = useUpdateTestCaseStep(projectId, suiteId, caseId);
  const reorder = useReorderTestCaseSteps(projectId, suiteId, caseId);
  const deleteStep = useDeleteTestCaseStep(projectId, suiteId, caseId);
  const showSkeleton = useIsLoadingVisible(isPending);

  const { sortedSteps, nextOrder } = useMemo(() => {
    const sorted = [...(steps ?? [])].toSorted(
      (itemA, itemB) => itemA.order - itemB.order,
    );

    return {
      sortedSteps: sorted,
      nextOrder: sorted.length > 0 ? sorted.at(-1)!.order + 1 : 1,
    };
  }, [steps]);

  const handleCreate = (input: CreateTestCaseStep) =>
    createStep.mutate(input, { onSuccess: close });
  const handleUpdate = (item: TestCaseStep) => (input: UpdateTestCaseStep) =>
    updateStep.mutate(
      { id: item.id, version: item.version, ...input },
      { onSuccess: close },
    );
  const handleDelete = (id: string) =>
    deleteStep.mutate(id, { onSuccess: close });
  const handleReorder = (steps: { id: string; order: number }[]) =>
    reorder.mutate({ steps });

  useBreadcrumbs([
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}/suites` },
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
        showSkeleton && (
          <SkeletonStatus label="Loading steps…">
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <StepRowSkeleton key={i} />
              ))}
            </div>
          </SkeletonStatus>
        )
      );
    if (isError) return <ErrorState error={error} onRetry={refetch} />;
    if (sortedSteps.length === 0)
      return (
        <EmptyState
          title="No steps defined"
          description="Break this test case down into clear, ordered steps."
        />
      );

    return (
      <StepsList
        sortedSteps={sortedSteps}
        isReordering={reorder.isPending}
        onReorder={canEdit ? handleReorder : undefined}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canEdit ? openDelete : undefined}
      />
    );
  };

  return (
    <div className="flex min-h-0 w-full flex-col">
      <PageHeader
        title={testCase?.name ?? "…"}
        badge={testCase && <PriorityBadge priority={testCase.priority} />}
        description={testCase?.description}
        backTo={{
          to: "/projects/$projectId/suites/$suiteId",
          params: { projectId, suiteId },
        }}
        backLabel={suite?.name ?? "Suite"}
        meta={
          testCase && (
            <>
              <span>
                {sortedSteps.length} step{sortedSteps.length === 1 ? "" : "s"}
              </span>
              <span>
                Updated <RelativeTime value={testCase.updated_at} />
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                {(testCase.labels ?? []).map((label) => (
                  <LabelBadge key={label.id} label={label} />
                ))}
                {canEdit && (
                  <LabelSelect
                    projectId={projectId}
                    suiteId={suiteId}
                    caseId={caseId}
                    assigned={testCase.labels ?? []}
                  />
                )}
              </span>
            </>
          )
        }
        actions={
          canEdit && (
            <>
              <button
                type="button"
                className="btn gap-1.5 btn-outline btn-sm"
                onClick={() => setIsEditOpen(true)}
                disabled={!testCase}
              >
                <PencilIcon className="size-3.5" aria-hidden="true" />
                Edit
              </button>
              <button
                className="btn shrink-0 btn-sm btn-primary"
                onClick={openCreate}
              >
                <PlusIcon className="size-4" aria-hidden="true" />
                Add Step
              </button>
            </>
          )
        }
      />

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <div className="min-h-80">{renderSteps()}</div>
      </section>

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Test Case"
      >
        {isEditOpen && testCase && (
          <CaseForm
            key={testCase.id}
            defaultValues={{
              name: testCase.name,
              description: testCase.description ?? "",
              priority: testCase.priority,
            }}
            onSubmit={(input) =>
              updateCase.mutate(
                { id: testCase.id, version: testCase.version, ...input },
                { onSuccess: () => setIsEditOpen(false) },
              )
            }
            onCancel={() => setIsEditOpen(false)}
            isLoading={updateCase.isPending}
          />
        )}
      </Modal>
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
              expectedResult: modal.item.expected_result,
            }}
            nextOrder={nextOrder}
            onSubmit={handleUpdate(modal.item)}
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
