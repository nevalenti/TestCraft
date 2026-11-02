import { getRouteApi } from "@tanstack/react-router";
import {
  getCoreRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  type CreateTestResult,
  type TestResult,
  TestRunStatus,
  type UpdateTestResult,
} from "@testcraft/types";
import { useMemo, useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { AttachmentModal } from "@/features/attachments/AttachmentModal";
import { useProject } from "@/features/projects/hooks";
import { useProjectPermissions } from "@/features/projects/permissions";
import { ShareModal } from "@/features/shareTokens/ShareModal";
import {
  RESULTS_PAGE_SIZE,
  type ResultSortKey,
} from "@/features/testResults/api";
import { createColumns } from "@/features/testResults/columns";
import {
  useCreateTestResult,
  useDeleteTestResult,
  useTestResults,
  useUpdateTestResult,
} from "@/features/testResults/hooks";
import { ResultModals } from "@/features/testResults/ResultModals";
import { ResultsContent } from "@/features/testResults/ResultsContent";
import { RunSummaryBar } from "@/features/testResults/RunSummaryBar";
import {
  useTestRun,
  useTestRunSummary,
  useUpdateTestRun,
} from "@/features/testRuns/hooks";
import { LiveLogFeed } from "@/features/testRuns/LiveLogFeed";
import { LogPanel } from "@/features/testRuns/LogPanel";
import { useTestRunRealtime } from "@/features/testRuns/useTestRunRealtime";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useModal } from "@/hooks/useModal";
import { cn } from "@/lib/cn";
import { GroupedResults } from "@/pages/run/GroupedResults";
import { RunPageHeader } from "@/pages/run/RunPageHeader";
import type { RunView } from "@/pages/run/RunViewTabs";
import { useRunPageSearch } from "@/pages/run/useRunPageSearch";

const routeApi = getRouteApi("/_app/projects/$projectId_/runs/$runId");

export const RunPage = () => {
  const { projectId, runId } = routeApi.useParams();
  const { canEdit } = useProjectPermissions(projectId);
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestResult>();
  const [shareOpen, setShareOpen] = useState(false);
  const [view, setView] = useState<RunView>("table");
  const [attachmentResult, setAttachmentResult] = useState<TestResult | null>(
    null,
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: RESULTS_PAGE_SIZE,
  });

  const onEditResult = canEdit ? openEdit : undefined;
  const onDeleteResult = canEdit ? openDelete : undefined;
  const onAddResult = canEdit ? openCreate : undefined;

  const resetPage = () =>
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));

  const {
    statusFilter,
    isGrouped,
    search,
    setSearch,
    debouncedSearch,
    setStatusFilter: handleStatusFilter,
    setGrouped,
  } = useRunPageSearch(resetPage);
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
    sorting[0]?.id as ResultSortKey | undefined,
    sorting[0] && (sorting[0].desc ? "desc" : "asc"),
  );
  const createResult = useCreateTestResult(projectId, runId);
  const updateRun = useUpdateTestRun(projectId);
  const updateResult = useUpdateTestResult(projectId, runId);
  const deleteResult = useDeleteTestResult(projectId, runId);

  useTestRunRealtime(projectId, runId);

  const handleSortingChange: typeof setSorting = (next) => {
    setSorting(next);
    resetPage();
  };

  const handleComplete = () => {
    if (!run) return;
    updateRun.mutate({
      id: run.id,
      version: run.version,
      name: run.name,
      environment: run.environment,
      status: TestRunStatus.Completed,
    });
  };

  const handleCreate = (input: CreateTestResult) =>
    createResult.mutate(input, { onSuccess: close });
  const handleUpdate = (item: TestResult) => (input: UpdateTestResult) =>
    updateResult.mutate(
      { id: item.id, version: item.version, ...input },
      { onSuccess: close },
    );
  const handleDelete = (id: string) =>
    deleteResult.mutate(id, { onSuccess: close });

  useBreadcrumbs([
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}` },
    { label: run?.name ?? "…" },
  ]);

  const isShowNotes = !!resultsPage?.items.some((result) => result.notes);
  const columns = useMemo(
    () =>
      createColumns({
        onEdit: onEditResult,
        onDelete: onDeleteResult,
        onAttachment: setAttachmentResult,
        showNotes: isShowNotes,
      }),
    [onEditResult, onDeleteResult, setAttachmentResult, isShowNotes],
  );

  const pageCount = resultsPage
    ? Math.ceil(resultsPage.total / RESULTS_PAGE_SIZE)
    : -1;

  const table = useReactTable({
    data: resultsPage?.items ?? [],
    columns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: handleSortingChange,
    pageCount,
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const resultsContent = (
    <ResultsContent
      isPending={isPending}
      isSummaryPending={isSummaryPending}
      isError={isError}
      error={error}
      onRetry={refetch}
      resultsPage={resultsPage}
      statusFilter={statusFilter}
      debouncedSearch={debouncedSearch}
      openCreate={onAddResult}
      onClearSearch={() => setSearch("")}
      onClearFilter={() => handleStatusFilter(null)}
      table={table}
      pageCount={pageCount}
    />
  );

  let viewContent: React.ReactNode;
  if (view === "live") {
    viewContent = <LiveLogFeed projectId={projectId} runId={runId} />;
  } else if (view === "logs") {
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
              onStatusFilter={handleStatusFilter}
              search={search}
              onSearch={setSearch}
              onAdd={onAddResult}
              isGrouped={isGrouped}
              onGroupedChange={setGrouped}
            />
          )
        )}
        <div className="min-h-80">
          {isGrouped ? (
            <GroupedResults
              projectId={projectId}
              runId={runId}
              status={statusFilter ?? undefined}
              search={debouncedSearch || undefined}
              onEdit={onEditResult}
              onDelete={onDeleteResult}
              onAttachment={setAttachmentResult}
              fallback={resultsContent}
            />
          ) : (
            resultsContent
          )}
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-col">
      <RunPageHeader
        run={run}
        projectId={projectId}
        view={view}
        onViewChange={setView}
        canEdit={canEdit}
        onComplete={handleComplete}
        isCompleting={updateRun.isPending}
        onShare={() => setShareOpen(true)}
      />

      <section
        className={cn(
          "page-content min-h-0 flex-1",
          view === "table" ? "overflow-y-auto" : "flex overflow-hidden",
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
        resultId={attachmentResult?.id ?? ""}
        testCaseName={attachmentResult?.test_case_name ?? ""}
        readOnly={!canEdit}
      />
    </div>
  );
};
