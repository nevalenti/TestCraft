import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import {
  createColumnHelper,
  flexRender,
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

import { ErrorState } from "@/components/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ResourceActions } from "@/components/ui/ResourceActions";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/hooks/useModal";
import { useProject } from "@/hooks/useProjects";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import {
  useCreateTestResult,
  useDeleteTestResult,
  useTestResults,
  useUpdateTestResult,
} from "@/hooks/useTestResults";
import { useTestRun, useTestRunSummary } from "@/hooks/useTestRuns";
import { RESULTS_PAGE_SIZE, statusOptions } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { CreateResultForm } from "@/pages/TestRunPage/CreateResultForm";
import { UpdateResultForm } from "@/pages/TestRunPage/UpdateResultForm";

type SummaryCountKey = "passed" | "failed" | "blocked" | "skipped";

const passRateClass = (rate: number) =>
  rate >= 80 ? "text-success" : rate >= 50 ? "text-warning" : "text-error";

const SUMMARY_KEY: Record<string, SummaryCountKey> = {
  Passed: "passed",
  Failed: "failed",
  Blocked: "blocked",
  Skipped: "skipped",
};

const columnHelper = createColumnHelper<TestResult>();

export const TestRunPage = () => {
  const projectId = useRequiredParam("projectId");
  const runId = useRequiredParam("runId");
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestResult>();
  const [statusFilter, setStatusFilter] = useState<TestResultStatus | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: RESULTS_PAGE_SIZE,
  });

  const debouncedSearch = useDebounce(search, 300);
  const { data: project } = useProject(projectId);
  const { data: run } = useTestRun(projectId, runId);
  const { data: runSummary } = useTestRunSummary(projectId, runId);
  const {
    data: resultsPage,
    isPending,
    isError,
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

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
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
    () => [
      columnHelper.display({
        id: "index",
        header: "#",
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination;
          return (
            <span className="text-base-content/40 tabular-nums text-xs">
              {pageIndex * pageSize + row.index + 1}
            </span>
          );
        },
      }),
      columnHelper.accessor("testCaseName", {
        header: "Test Case",
        cell: (info) => (
          <span className="font-medium text-sm line-clamp-1">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("notes", {
        header: "Notes",
        enableSorting: false,
        cell: (info) => {
          const value = info.getValue();
          return value ? (
            <div
              className="max-w-[200px] truncate text-sm text-base-content/60 cursor-default"
              title={value}
            >
              {value}
            </div>
          ) : (
            <span className="text-base-content/30 italic text-sm">—</span>
          );
        },
      }),
      columnHelper.accessor("executedAt", {
        header: "Executed",
        cell: (info) => (
          <span className="text-xs tabular-nums text-base-content/50 whitespace-nowrap">
            {formatDateTime(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <ResourceActions
              onEdit={() => openEdit(row.original)}
              onDelete={() => openDelete(row.original)}
              label="result"
              size="sm"
            />
          </div>
        ),
      }),
    ],
    [openEdit, openDelete],
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

  return (
    <div className="w-full flex flex-col min-h-0">
      <header className="page-header flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display">
            {run?.name ?? (
              <span className="skeleton inline-block w-48 h-[0.75em] rounded align-middle" />
            )}
          </h1>
          <p className="mt-0.5 text-sm text-base-content/60">
            {run?.environment ?? "Track test results for this run"}
          </p>
        </div>
      </header>

      <section className="page-content flex-1 overflow-y-auto min-h-0">
        {runSummary && runSummary.total > 0 && (
          <p className="text-sm text-base-content/60 mb-4">
            <span className="font-semibold text-base-content">
              {runSummary.total}
            </span>{" "}
            result{runSummary.total !== 1 ? "s" : ""} ·{" "}
            <span
              className={`font-semibold ${passRateClass(runSummary.passRate)}`}
            >
              {runSummary.passRate}%
            </span>{" "}
            pass rate
          </p>
        )}

        {runSummary && runSummary.total > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <input
              type="search"
              className="input input-bordered bg-base-200 w-full max-w-sm"
              placeholder="Search test cases…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              className="btn btn-primary btn-sm ml-auto shrink-0"
              onClick={openCreate}
            >
              <PlusIcon className="size-4" aria-hidden="true" />
              Add Result
            </button>
          </div>
        )}

        {runSummary && runSummary.total > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {statusFilter !== null && (
              <button
                onClick={() => setStatusFilter(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-base-100 hover:bg-base-200 transition-colors"
              >
                All results
              </button>
            )}
            {statusOptions.map(({ value }) => {
              const count = runSummary[SUMMARY_KEY[value]];
              return count > 0 ? (
                <button
                  key={value}
                  onClick={() =>
                    setStatusFilter(statusFilter === value ? null : value)
                  }
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    statusFilter === value
                      ? "border-base-content/40 bg-base-200 shadow-sm"
                      : "border-border bg-base-100 hover:bg-base-200"
                  }`}
                >
                  <StatusBadge status={value} />
                  <span className="font-bold text-base-content/75 tabular-nums text-sm">
                    {count}
                  </span>
                </button>
              ) : null;
            })}
          </div>
        )}

        <div className="min-h-80">
          {isPending ? (
            <SkeletonGrid />
          ) : isError ? (
            <ErrorState message="Failed to load results. Please check your connection and try again." />
          ) : resultsPage?.items.length === 0 &&
            statusFilter === null &&
            !debouncedSearch ? (
            <EmptyState
              title="No results recorded"
              description="Add results to track the outcome of each test case in this run."
            />
          ) : resultsPage?.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-semibold text-base-content/60 mb-2">
                No results match
              </p>
              <div className="flex gap-2">
                {debouncedSearch && (
                  <button
                    className="btn btn-outline btn-sm"
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
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
                <table className="table table-sm">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr
                        key={headerGroup.id}
                        className="text-xs text-base-content/60"
                      >
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                            className={
                              header.column.getCanSort()
                                ? "cursor-pointer select-none"
                                : ""
                            }
                          >
                            <span className="inline-flex items-center gap-1">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {header.column.getCanSort() && (
                                <span className="text-base-content/30">
                                  {header.column.getIsSorted() === "asc"
                                    ? "▲"
                                    : header.column.getIsSorted() === "desc"
                                      ? "▼"
                                      : "⬍"}
                                </span>
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        data-testid="result-row"
                        className="group hover:bg-base-200/50 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pageCount > 1 && (
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="text-sm text-base-content/60">
                    Page{" "}
                    <span className="font-semibold text-base-content">
                      {pagination.pageIndex + 1}
                    </span>{" "}
                    of {pageCount}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-sm btn-neutral btn-square"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      aria-label="Previous page"
                    >
                      <ChevronLeftIcon className="size-4" />
                    </button>
                    <button
                      className="btn btn-sm btn-neutral btn-square"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label="Next page"
                    >
                      <ChevronRightIcon className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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
    </div>
  );
};
