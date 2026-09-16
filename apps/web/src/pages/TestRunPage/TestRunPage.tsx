import { ShareIcon } from '@heroicons/react/24/solid';
import {
  getCoreRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  type CreateTestResult,
  type TestResult,
  TestResultStatus,
  type UpdateTestResult,
} from '@testcraft/types';
import { useEffect, useMemo, useState } from 'react';

import { ErrorState } from '@/components/ErrorState';
import { AttachmentModal } from '@/features/attachments/AttachmentModal';
import { useProject } from '@/features/projects/hooks';
import { ShareModal } from '@/features/shareTokens/ShareModal';
import { RESULTS_PAGE_SIZE } from '@/features/testResults/api';
import { createColumns } from '@/features/testResults/columns';
import {
  useCreateTestResult,
  useDeleteTestResult,
  useTestResults,
  useUpdateTestResult,
} from '@/features/testResults/hooks';
import { ResultsContent } from '@/features/testResults/ResultsContent';
import { useTestRun, useTestRunSummary } from '@/features/testRuns/hooks';
import { useTestRunRealtime } from '@/features/testRuns/useTestRunRealtime';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { useDebounce } from '@/hooks/useDebounce';
import { useModal } from '@/hooks/useModal';
import { useRequiredParam } from '@/hooks/useRequiredParam';
import { cn } from '@/lib/cn';
import { LiveLogFeed } from '@/pages/TestRunPage/LiveLogFeed';
import { LogPanel } from '@/pages/TestRunPage/LogPanel';
import { ResultModals } from '@/pages/TestRunPage/ResultModals';
import { RunSummaryBar } from '@/pages/TestRunPage/RunSummaryBar';
import { type RunView, RunViewTabs } from '@/pages/TestRunPage/RunViewTabs';

export const TestRunPage = () => {
  const projectId = useRequiredParam('projectId');
  const runId = useRequiredParam('runId');
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestResult>();
  const [shareOpen, setShareOpen] = useState(false);
  const [view, setView] = useState<RunView>('table');
  const [attachmentResult, setAttachmentResult] = useState<TestResult | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<TestResultStatus | null>(
    null,
  );
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: RESULTS_PAGE_SIZE,
  });

  const debouncedSearch = useDebounce(search, 300);
  const { data: project } = useProject(projectId);
  const { data: run } = useTestRun(projectId, runId);
  const {
    data: runSummary,
    isPending: isSummaryPending,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useTestRunSummary(projectId, runId);
  const {
    data: resultsPage,
    isPending,
    isError,
    error,
    refetch,
  } = useTestResults(
    projectId,
    runId,
    statusFilter ?? undefined,
    debouncedSearch || undefined,
    pagination.pageIndex + 1,
  );
  const createResult = useCreateTestResult(projectId, runId);
  const updateResult = useUpdateTestResult(projectId, runId);
  const deleteResult = useDeleteTestResult(projectId, runId);

  useTestRunRealtime(projectId, runId);

  useEffect(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }, [statusFilter, debouncedSearch]);

  const handleCreate = (input: CreateTestResult) =>
    createResult.mutate(input, { onSuccess: close });
  const handleUpdate = (id: string) => (input: UpdateTestResult) =>
    updateResult.mutate({ id, ...input }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteResult.mutate(id, { onSuccess: close });

  useBreadcrumbs([
    { label: 'Projects', href: '/projects' },
    { label: project?.name ?? '…', href: `/projects/${projectId}` },
    { label: run?.name ?? '…' },
  ]);

  const columns = useMemo(
    () =>
      createColumns({
        onEdit: openEdit,
        onDelete: openDelete,
        onAttachment: setAttachmentResult,
      }),
    [openEdit, openDelete, setAttachmentResult],
  );

  const pageCount = resultsPage
    ? Math.ceil(resultsPage.total / RESULTS_PAGE_SIZE)
    : -1;

  const table = useReactTable({
    data: resultsPage?.items ?? [],
    columns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    pageCount,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  let viewContent: React.ReactNode;
  if (view === 'live') {
    viewContent = <LiveLogFeed projectId={projectId} runId={runId} />;
  } else if (view === 'logs') {
    viewContent = <LogPanel projectId={projectId} runId={runId} />;
  } else {
    viewContent = (
      <>
        {isSummaryError ? (
          <ErrorState
            title="Failed to load run summary"
            error={summaryError}
            onRetry={refetchSummary}
          />
        ) : (
          runSummary &&
          runSummary.total > 0 && (
            <RunSummaryBar
              runSummary={runSummary}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
              search={search}
              onSearch={setSearch}
              onAdd={openCreate}
            />
          )
        )}
        <div className="min-h-80">
          <ResultsContent
            isPending={isPending}
            isSummaryPending={isSummaryPending}
            isError={isError}
            error={error}
            onRetry={refetch}
            resultsPage={resultsPage}
            statusFilter={statusFilter}
            debouncedSearch={debouncedSearch}
            openCreate={openCreate}
            onClearSearch={() => setSearch('')}
            onClearFilter={() => setStatusFilter(null)}
            table={table}
            pageCount={pageCount}
          />
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{run?.name}</h1>
          <p className="mt-0.5 text-sm text-base-content/70">
            {run?.environment ?? 'Track test results for this run'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RunViewTabs view={view} onChange={setView} />
          <button
            className="btn btn-square btn-ghost btn-sm"
            onClick={() => setShareOpen(true)}
            aria-label="Share this run"
          >
            <ShareIcon className="size-4" />
          </button>
        </div>
      </header>

      <section
        className={cn(
          'page-content min-h-0 flex-1',
          view === 'table' ? 'overflow-y-auto' : 'flex overflow-hidden',
        )}
      >
        {viewContent}
      </section>

      <ResultModals
        modal={modal}
        close={close}
        projectId={projectId}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isCreating={createResult.isPending}
        isUpdating={updateResult.isPending}
        isDeleting={deleteResult.isPending}
      />
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        projectId={projectId}
        runId={runId}
      />
      <AttachmentModal
        isOpen={attachmentResult !== null}
        onClose={() => setAttachmentResult(null)}
        projectId={projectId}
        runId={runId}
        resultId={attachmentResult?.id ?? ''}
        testCaseName={attachmentResult?.testCaseName ?? ''}
      />
    </div>
  );
};
