import { PlusIcon } from '@heroicons/react/24/solid';
import type {
  CreateTestPlan,
  TestPlan,
  UpdateTestPlan,
} from '@testcraft/types';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ListToolbar } from '@/components/ui/ListToolbar';
import { Modal } from '@/components/ui/Modal';
import { ResourceView } from '@/components/ui/ResourceView';
import { useProject } from '@/features/projects/hooks';
import {
  useCreateTestPlan,
  useDeleteTestPlan,
  useTestPlans,
  useUpdateTestPlan,
} from '@/features/testPlans/hooks';
import { TestPlanForm } from '@/features/testPlans/TestPlanForm';
import { TestPlansTable } from '@/features/testPlans/TestPlansTable';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { useModal } from '@/hooks/useModal';
import { useRequiredParam } from '@/hooks/useRequiredParam';

export const TestPlansPage = () => {
  const projectId = useRequiredParam('projectId');
  const { data: project } = useProject(projectId);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const {
    data: plans,
    isPending,
    isError,
    error,
    refetch,
  } = useTestPlans(projectId);
  const createPlan = useCreateTestPlan(projectId);
  const updatePlan = useUpdateTestPlan(projectId);
  const deletePlan = useDeleteTestPlan(projectId);
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestPlan>();
  const showSkeleton = useIsLoadingVisible(isPending);

  useBreadcrumbs([
    { label: 'Projects', href: '/projects' },
    { label: project?.name ?? '…', href: `/projects/${projectId}` },
    { label: 'Test Plans' },
  ]);

  const handleCreate = (input: CreateTestPlan) =>
    createPlan.mutate(input, { onSuccess: close });
  const handleUpdate = (id: string) => (input: UpdateTestPlan) =>
    updatePlan.mutate({ id, ...input }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deletePlan.mutate(id, { onSuccess: close });

  const deleteItem = modal.type === 'delete' ? modal.item : null;

  const visiblePlans = debouncedSearch
    ? (plans ?? []).filter((plan) =>
        plan.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : plans;

  const renderTable = (items: TestPlan[]) => (
    <TestPlansTable
      plans={items}
      projectId={projectId}
      onEdit={openEdit}
      onDelete={openDelete}
    />
  );

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header">
        <h1 className="page-title">Test Plans</h1>
        <p className="mt-0.5 text-sm text-base-content/70">
          Pre-select test cases for structured test runs
        </p>
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <ListToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search test plans…"
        >
          <button className="btn btn-sm btn-primary" onClick={openCreate}>
            <PlusIcon className="size-4" aria-hidden="true" />
            New Test Plan
          </button>
        </ListToolbar>

        <ResourceView
          isPending={isPending}
          showSkeleton={showSkeleton}
          skeletonLabel="Loading test plans…"
          isError={isError}
          error={error}
          onRetry={refetch}
          items={plans}
          displayItems={visiblePlans}
          viewMode="list"
          emptyTitle="No test plans yet"
          emptyDescription="Create a plan to pre-select test cases and run them as a structured suite."
          renderTable={renderTable}
        />
      </section>

      <Modal
        isOpen={modal.type === 'create'}
        onClose={close}
        title="New Test Plan"
      >
        {modal.type === 'create' && (
          <TestPlanForm
            submitLabel="Create"
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createPlan.isPending}
          />
        )}
      </Modal>

      <Modal
        isOpen={modal.type === 'edit'}
        onClose={close}
        title="Edit Test Plan"
      >
        {modal.type === 'edit' && (
          <TestPlanForm
            key={modal.item.id}
            submitLabel="Save"
            defaultValues={{
              name: modal.item.name,
              description: modal.item.description ?? '',
            }}
            onSubmit={handleUpdate(modal.item.id)}
            onCancel={close}
            isLoading={updatePlan.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={modal.type === 'delete'}
        onClose={close}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        title="Delete Test Plan"
        description={deleteItem ? `Delete "${deleteItem.name}"?` : ''}
        isLoading={deletePlan.isPending}
      />
    </div>
  );
};
