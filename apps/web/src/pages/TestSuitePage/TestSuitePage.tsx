import { PlusIcon } from '@heroicons/react/24/solid';
import type {
  CreateTestCase,
  TestCase,
  UpdateTestCase,
} from '@testcraft/types';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ListToolbar } from '@/components/ui/ListToolbar';
import { MetaPill } from '@/components/ui/MetaPill';
import { Modal } from '@/components/ui/Modal';
import { ResourceView } from '@/components/ui/ResourceView';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { useProject } from '@/features/projects/hooks';
import {
  useCreateTestCase,
  useDeleteTestCase,
  useTestCases,
  useUpdateTestCase,
} from '@/features/testCases/hooks';
import { TestCaseCard } from '@/features/testCases/TestCaseCard';
import { TestCaseForm } from '@/features/testCases/TestCaseForm';
import { TestCaseListItem } from '@/features/testCases/TestCaseListItem';
import { useTestSuite } from '@/features/testSuites/hooks';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { useModal } from '@/hooks/useModal';
import { useRequiredParam } from '@/hooks/useRequiredParam';
import { useViewModeStore } from '@/stores/viewMode';

export const TestSuitePage = () => {
  const projectId = useRequiredParam('projectId');
  const suiteId = useRequiredParam('suiteId');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const viewMode = useViewModeStore((state) => state.viewMode);
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestCase>();

  const { data: project } = useProject(projectId);
  const { data: suite } = useTestSuite(projectId, suiteId);
  const {
    data: testCases,
    isPending,
    isError,
    error,
    refetch,
  } = useTestCases(projectId, suiteId, debouncedSearch || undefined);
  const createCase = useCreateTestCase(projectId, suiteId);
  const updateCase = useUpdateTestCase(projectId, suiteId);
  const deleteCase = useDeleteTestCase(projectId, suiteId);
  const showSkeleton = useIsLoadingVisible(isPending);

  const handleCreate = (input: CreateTestCase) =>
    createCase.mutate(input, { onSuccess: close });
  const handleUpdate = (id: string) => (input: UpdateTestCase) =>
    updateCase.mutate({ id, ...input }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteCase.mutate(id, { onSuccess: close });

  useBreadcrumbs([
    { label: 'Projects', href: '/projects' },
    { label: project?.name ?? '…', href: `/projects/${projectId}/suites` },
    { label: suite?.name ?? '…' },
  ]);

  const deleteItem = modal.type === 'delete' ? modal.item : null;

  const renderListItem = (testCase: TestCase) => (
    <TestCaseListItem
      key={testCase.id}
      testCase={testCase}
      projectId={projectId}
      suiteId={suiteId}
      onEdit={() => openEdit(testCase)}
      onDelete={() => openDelete(testCase)}
    />
  );

  const renderCard = (testCase: TestCase) => (
    <TestCaseCard
      key={testCase.id}
      testCase={testCase}
      projectId={projectId}
      suiteId={suiteId}
      onEdit={() => openEdit(testCase)}
      onDelete={() => openDelete(testCase)}
    />
  );

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">{suite?.name}</h1>
            {suite?.source && <MetaPill>{suite.source}</MetaPill>}
          </div>
          <p className="mt-0.5 text-sm text-base-content/70">
            {suite?.description ?? 'Test cases in this suite'}
          </p>
        </div>
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <ListToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search test cases…"
        >
          <ViewToggle />
          <button className="btn btn-sm btn-primary" onClick={openCreate}>
            <PlusIcon className="size-4" aria-hidden="true" />
            New Test Case
          </button>
        </ListToolbar>
        <div className="min-h-80">
          <ResourceView
            isPending={isPending}
            showSkeleton={showSkeleton}
            skeletonLabel="Loading test cases…"
            isError={isError}
            error={error}
            onRetry={refetch}
            items={testCases}
            viewMode={viewMode}
            emptyTitle="No test cases yet"
            emptyDescription="Add test cases to document expected behaviour."
            renderListItem={renderListItem}
            renderCard={renderCard}
          />
        </div>
      </section>

      <Modal
        isOpen={modal.type === 'create'}
        onClose={close}
        title="New Test Case"
      >
        {modal.type === 'create' && (
          <TestCaseForm
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createCase.isPending}
          />
        )}
      </Modal>
      <Modal
        isOpen={modal.type === 'edit'}
        onClose={close}
        title="Edit Test Case"
      >
        {modal.type === 'edit' && (
          <TestCaseForm
            key={modal.item.id}
            defaultValues={{
              name: modal.item.name,
              description: modal.item.description ?? '',
              priority: modal.item.priority,
            }}
            onSubmit={handleUpdate(modal.item.id)}
            onCancel={close}
            isLoading={updateCase.isPending}
          />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={modal.type === 'delete'}
        onClose={close}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        title="Delete Test Case"
        description={deleteItem ? `Delete "${deleteItem.name}"?` : ''}
        isLoading={deleteCase.isPending}
      />
    </div>
  );
};
