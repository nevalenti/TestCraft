import { PlusIcon } from '@heroicons/react/24/solid';
import type {
  CreateTestCaseStep,
  TestCaseStep,
  UpdateTestCaseStep,
} from '@testcraft/types';
import { useMemo } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LabelBadge } from '@/components/ui/LabelBadge';
import { Modal } from '@/components/ui/Modal';
import { SkeletonStatus } from '@/components/ui/SkeletonStatus';
import { useProject } from '@/features/projects/hooks';
import { useTestCase } from '@/features/testCases/hooks';
import {
  useBulkReorderSteps,
  useCreateTestCaseStep,
  useDeleteTestCaseStep,
  useTestCaseSteps,
  useUpdateTestCaseStep,
} from '@/features/testCaseSteps/hooks';
import { StepForm } from '@/features/testCaseSteps/StepForm';
import { StepRowSkeleton } from '@/features/testCaseSteps/StepRowSkeleton';
import { StepsList } from '@/features/testCaseSteps/StepsList';
import { useTestSuite } from '@/features/testSuites/hooks';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { useModal } from '@/hooks/useModal';
import { useRequiredParam } from '@/hooks/useRequiredParam';
import { LabelSelect } from '@/pages/TestCasePage/LabelSelect';

export const TestCasePage = () => {
  const projectId = useRequiredParam('projectId');
  const suiteId = useRequiredParam('suiteId');
  const caseId = useRequiredParam('caseId');
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestCaseStep>();

  const { data: project } = useProject(projectId);
  const { data: suite } = useTestSuite(projectId, suiteId);
  const { data: testCase } = useTestCase(projectId, suiteId, caseId);
  const {
    data: steps,
    isPending,
    isError,
    error,
    refetch,
  } = useTestCaseSteps(projectId, suiteId, caseId);
  const createStep = useCreateTestCaseStep(projectId, suiteId, caseId);
  const updateStep = useUpdateTestCaseStep(projectId, suiteId, caseId);
  const bulkReorder = useBulkReorderSteps(projectId, suiteId, caseId);
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
  const handleUpdate = (id: string) => (input: UpdateTestCaseStep) =>
    updateStep.mutate({ id, ...input }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteStep.mutate(id, { onSuccess: close });
  const handleReorder = (steps: { id: string; order: number }[]) =>
    bulkReorder.mutate({ steps });

  useBreadcrumbs([
    { label: 'Projects', href: '/projects' },
    { label: project?.name ?? '…', href: `/projects/${projectId}/suites` },
    {
      label: suite?.name ?? '…',
      href: `/projects/${projectId}/suites/${suiteId}`,
    },
    { label: testCase?.name ?? '…' },
  ]);

  const deleteItem = modal.type === 'delete' ? modal.item : null;

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
        isReordering={bulkReorder.isPending}
        onReorder={handleReorder}
        onEdit={openEdit}
        onDelete={openDelete}
      />
    );
  };

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{testCase?.name}</h1>
          <p className="mt-0.5 text-sm text-base-content/70">
            {testCase?.description ?? 'Steps for this test case'}
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

      <Modal isOpen={modal.type === 'create'} onClose={close} title="Add Step">
        {modal.type === 'create' && (
          <StepForm
            nextOrder={nextOrder}
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createStep.isPending}
          />
        )}
      </Modal>
      <Modal isOpen={modal.type === 'edit'} onClose={close} title="Edit Step">
        {modal.type === 'edit' && (
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
        isOpen={modal.type === 'delete'}
        onClose={close}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        title="Delete Step"
        description={
          deleteItem
            ? `Delete step ${deleteItem.order}? This cannot be undone.`
            : ''
        }
        isLoading={deleteStep.isPending}
      />
    </div>
  );
};
