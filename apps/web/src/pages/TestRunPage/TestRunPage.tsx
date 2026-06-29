import { PlusIcon, ShareIcon } from "@heroicons/react/24/solid";
import { useQueryClient } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  type CreateTestResult,
  type TestResult,
  TestResultStatus,
  type UpdateTestResult,
} from "@testcraft/types";
import { useEffect, useMemo, useState } from "react";

import { queryKeys } from "@/api/queryKeys";
import { ErrorState } from "@/components/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/hooks/useModal";
import { useProject } from "@/hooks/useProjects";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import { useSignalR } from "@/hooks/useSignalR";
import {
  useCreateTestResult,
  useDeleteTestResult,
  useTestResults,
  useUpdateTestResult,
} from "@/hooks/useTestResults";
import { useTestRun, useTestRunSummary } from "@/hooks/useTestRuns";
import { RESULTS_PAGE_SIZE } from "@/lib/constants";
import { AttachmentModal } from "@/pages/TestRunPage/AttachmentModal";
import { createColumns } from "@/pages/TestRunPage/columns";
import { CreateResultForm } from "@/pages/TestRunPage/CreateResultForm";
import { ResultsTable } from "@/pages/TestRunPage/ResultsTable";
import { RunSummaryBar } from "@/pages/TestRunPage/RunSummaryBar";
import { ShareModal } from "@/pages/TestRunPage/ShareModal";
import { UpdateResultForm } from "@/pages/TestRunPage/UpdateResultForm";

export const TestRunPage = () => {
  const projectId = useRequiredParam("projectId");
  const runId = useRequiredParam("runId");
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestResult>();
  const [shareOpen, setShareOpen] = useState(false);
  const [attachmentResult, setAttachmentResult] = useState<TestResult | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<TestResultStatus | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: RESULTS_PAGE_SIZE,
  });

  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 300);
  const { data: project } = useProject(projectId);
  const { data: run } = useTestRun(projectId, runId);
  const { data: runSummary, isPending: isSummaryPending } = useTestRunSummary(
    projectId,
    runId,
  );
  const {
    data: resultsPage,
    isPending,
    isError,
    error,
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

  useSignalR(runId, {
    ResultAdded: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testResults.all(projectId, runId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.summary(projectId, runId),
      });
    },
    ResultUpdated: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testResults.all(projectId, runId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.summary(projectId, runId),
      });
    },
    ResultDeleted: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testResults.all(projectId, runId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.summary(projectId, runId),
      });
    },
    RunStatusChanged: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.detail(projectId, runId),
      });
    },
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [statusFilter, debouncedSearch]);

  const handleCreate = (input: CreateTestResult) =>
    createResult.mutate(input, { onSuccess: close });
  const handleUpdate = (id: string) => (input: UpdateTestResult) =>
    updateResult.mutate({ id, ...input }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteResult.mutate(id, { onSuccess: close });

  useBreadcrumbs([
    { label: "Dashboard", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}` },
    { label: run?.name ?? "…" },
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

  const deleteItem = modal.type === "delete" ? modal.item : null;

  const renderResults = () => {
    if (isPending || isSummaryPending)
      return (
        <div className="flex min-h-80 items-center justify-center">
          <span className="loading loading-lg loading-spinner text-primary" />
        </div>
      );
    if (isError) return <ErrorState error={error} />;
    if (
      resultsPage?.items.length === 0 &&
      statusFilter === null &&
      !debouncedSearch
    )
      return (
        <EmptyState
          title="No results recorded"
          description="Add results to track the outcome of each test case in this run."
          action={
            <button
              className="btn gap-1.5 btn-sm btn-primary"
              onClick={openCreate}
            >
              <PlusIcon className="size-4" aria-hidden="true" />
              Add Result
            </button>
          }
        />
      );
    if (resultsPage?.items.length === 0)
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="mb-2 text-sm font-semibold text-base-content/60">
            No results match
          </p>
          <div className="flex gap-2">
            {debouncedSearch && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            )}
            {statusFilter !== null && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setStatusFilter(null)}
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      );

    return <ResultsTable table={table} pageCount={pageCount} />;
  };

  return (
    <div className="flex min-h-0 w-full flex-col">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {run?.name}
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            {run?.environment ?? "Track test results for this run"}
          </p>
        </div>
        <button
          className="btn gap-1.5 btn-ghost btn-sm"
          onClick={() => setShareOpen(true)}
          aria-label="Share this run"
        >
          <ShareIcon className="size-4" />
          Share
        </button>
      </header>

      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        {runSummary && runSummary.total > 0 && (
          <RunSummaryBar
            runSummary={runSummary}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            search={search}
            onSearch={setSearch}
            onAdd={openCreate}
          />
        )}
        <div className="min-h-80">{renderResults()}</div>
      </section>

      <Modal
        isOpen={modal.type === "create"}
        onClose={close}
        title="Add Test Result"
      >
        {modal.type === "create" && (
          <CreateResultForm
            projectId={projectId}
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createResult.isPending}
          />
        )}
      </Modal>
      <Modal isOpen={modal.type === "edit"} onClose={close} title="Edit Result">
        {modal.type === "edit" && (
          <UpdateResultForm
            key={modal.item.id}
            defaultValues={{
              status: modal.item.status,
              notes: modal.item.notes ?? "",
              durationMs: modal.item.durationMs,
              defectType: modal.item.defectType,
            }}
            onSubmit={handleUpdate(modal.item.id)}
            onCancel={close}
            isLoading={updateResult.isPending}
          />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={modal.type === "delete"}
        onClose={close}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        title="Delete Result"
        description={
          deleteItem ? `Delete result for "${deleteItem.testCaseName}"?` : ""
        }
        isLoading={deleteResult.isPending}
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
        resultId={attachmentResult?.id ?? ""}
        testCaseName={attachmentResult?.testCaseName ?? ""}
      />
    </div>
  );
};
