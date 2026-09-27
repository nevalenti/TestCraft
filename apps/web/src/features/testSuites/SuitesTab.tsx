import { PlusIcon } from '@heroicons/react/24/solid';
import type {
  CreateTestSuite,
  TestSuite,
  UpdateTestSuite,
} from '@testcraft/types';
import { useState } from 'react';

import { SourceFilter } from '@/components/SourceFilter';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ListToolbar } from '@/components/ui/ListToolbar';
import { Modal } from '@/components/ui/Modal';
import { ResourceView } from '@/components/ui/ResourceView';
import {
  useCreateTestSuite,
  useDeleteTestSuite,
  useTestSuites,
  useUpdateTestSuite,
} from '@/features/testSuites/hooks';
import { SuiteForm } from '@/features/testSuites/SuiteForm';
import { SuitesTable } from '@/features/testSuites/SuitesTable';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { useModal } from '@/hooks/useModal';
import { useRequiredParam } from '@/hooks/useRequiredParam';

export const SuitesTab = () => {
  const projectId = useRequiredParam('projectId');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestSuite>();
  const {
    data: suites,
    isPending,
    isError,
    error,
    refetch,
  } = useTestSuites(projectId, debouncedSearch || undefined);
  const createSuite = useCreateTestSuite(projectId);
  const updateSuite = useUpdateTestSuite(projectId);
  const deleteSuite = useDeleteTestSuite(projectId);
  const showSkeleton = useIsLoadingVisible(isPending);

  const handleCreate = (input: CreateTestSuite) =>
    createSuite.mutate(input, { onSuccess: close });
  const handleUpdate = (id: string) => (input: UpdateTestSuite) =>
    updateSuite.mutate({ id, ...input }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteSuite.mutate(id, { onSuccess: close });

  const deleteItem = modal.type === 'delete' ? modal.item : null;

  const allSuites = suites ?? [];
  const sources = [
    ...new Set(
      allSuites.map((suite) => suite.source).filter(Boolean) as string[],
    ),
  ].toSorted((sourceA, sourceB) => sourceA.localeCompare(sourceB));
  const sourceCounts = Object.fromEntries(
    sources.map((src) => [
      src,
      allSuites.filter((suite) => suite.source === src).length,
    ]),
  );
  const visibleSuites = sourceFilter
    ? allSuites.filter((suite) => suite.source === sourceFilter)
    : suites;

  const renderTable = (items: TestSuite[]) => (
    <SuitesTable
      suites={items}
      projectId={projectId}
      onEdit={openEdit}
      onDelete={openDelete}
    />
  );

  return (
    <>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search test suites…"
      >
        <button className="btn btn-sm btn-primary" onClick={openCreate}>
          <PlusIcon className="size-4" aria-hidden="true" />
          New Test Suite
        </button>
      </ListToolbar>

      <SourceFilter
        sources={sources}
        counts={sourceCounts}
        value={sourceFilter}
        onChange={setSourceFilter}
      />

      <ResourceView
        isPending={isPending}
        showSkeleton={showSkeleton}
        skeletonLabel="Loading test suites…"
        isError={isError}
        error={error}
        onRetry={refetch}
        items={suites}
        displayItems={visibleSuites}
        viewMode="list"
        emptyTitle="No test suites yet"
        emptyDescription="Group related test cases into suites."
        renderTable={renderTable}
      />

      <Modal
        isOpen={modal.type === 'create'}
        onClose={close}
        title="New Test Suite"
      >
        {modal.type === 'create' && (
          <SuiteForm
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createSuite.isPending}
          />
        )}
      </Modal>
      <Modal
        isOpen={modal.type === 'edit'}
        onClose={close}
        title="Edit Test Suite"
      >
        {modal.type === 'edit' && (
          <SuiteForm
            key={modal.item.id}
            defaultValues={{
              name: modal.item.name,
              description: modal.item.description ?? '',
            }}
            onSubmit={handleUpdate(modal.item.id)}
            onCancel={close}
            isLoading={updateSuite.isPending}
          />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={modal.type === 'delete'}
        onClose={close}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        title="Delete Test Suite"
        description={deleteItem ? `Delete "${deleteItem.name}"?` : ''}
        isLoading={deleteSuite.isPending}
      />
    </>
  );
};
