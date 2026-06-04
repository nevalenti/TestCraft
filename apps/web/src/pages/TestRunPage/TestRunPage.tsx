import { PlusIcon } from "@heroicons/react/24/solid";
import {
  type CreateTestResult,
  type TestResult,
  TestResultStatus,
  type UpdateTestResult,
} from "@testcraft/types";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
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
import { statusOptions } from "@/lib/constants";
import { CreateResultForm } from "@/pages/TestRunPage/CreateResultForm";
import { ResultRow } from "@/pages/TestRunPage/ResultRow";
import { UpdateResultForm } from "@/pages/TestRunPage/UpdateResultForm";

type SummaryCountKey = "passed" | "failed" | "blocked" | "skipped";

const SUMMARY_KEY: Record<string, SummaryCountKey> = {
  Passed: "passed",
  Failed: "failed",
  Blocked: "blocked",
  Skipped: "skipped",
};

export const TestRunPage = () => {
  const projectId = useRequiredParam("projectId");
  const runId = useRequiredParam("runId");
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestResult>();
  const [statusFilter, setStatusFilter] = useState<TestResultStatus | null>(
    null,
  );

  const { data: project } = useProject(projectId);
  const { data: run } = useTestRun(projectId, runId);
  const { data: runSummary } = useTestRunSummary(projectId, runId);
  const {
    data: results,
    isPending,
    isError,
  } = useTestResults(projectId, runId);
  const createResult = useCreateTestResult(projectId, runId);
  const updateResult = useUpdateTestResult(projectId, runId);
  const deleteResult = useDeleteTestResult(projectId, runId);

  const handleCreate = (input: CreateTestResult) =>
    createResult.mutate(input, { onSuccess: close });
  const handleUpdate = (id: string) => (input: UpdateTestResult) =>
    updateResult.mutate({ id, ...input }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteResult.mutate(id, { onSuccess: close });

  const filteredResults = useMemo(() => {
    if (!results || statusFilter === null) return results;
    return results.filter((result) => result.status === statusFilter);
  }, [results, statusFilter]);

  useBreadcrumbs([
    { label: "Dashboard", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}` },
    { label: run?.name ?? "…" },
  ]);

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
        <button
          className="btn btn-primary btn-sm shrink-0"
          onClick={openCreate}
        >
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-white/35 text-black">
            <PlusIcon className="size-3" aria-hidden="true" />
          </span>
          Add Result
        </button>
      </header>

      <section className="page-content flex-1 overflow-y-auto min-h-0">
        {runSummary && runSummary.total > 0 && (
          <p className="text-sm text-base-content/60 mb-4">
            <span className="font-semibold text-base-content">
              {runSummary.total}
            </span>{" "}
            result{runSummary.total !== 1 ? "s" : ""} ·{" "}
            <span
              className={`font-semibold ${
                runSummary.passRate >= 80
                  ? "text-success"
                  : runSummary.passRate >= 50
                    ? "text-warning"
                    : "text-error"
              }`}
            >
              {runSummary.passRate}%
            </span>{" "}
            pass rate
          </p>
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
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <p className="text-error font-semibold mb-2">
                  Failed to load results
                </p>
                <p className="text-base-content/60 text-sm mb-4">
                  Please check your connection and try again.
                </p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : results?.length === 0 ? (
            <EmptyState
              title="No results recorded"
              description="Add results to track the outcome of each test case in this run."
              action={
                <button className="btn btn-primary btn-sm" onClick={openCreate}>
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-white/35 text-black">
                    <PlusIcon className="size-3" aria-hidden="true" />
                  </span>
                  Add First Result
                </button>
              }
            />
          ) : filteredResults?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-semibold text-base-content/60 mb-2">
                No results match this filter
              </p>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setStatusFilter(null)}
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
              <table className="table table-sm">
                <thead>
                  <tr className="text-xs text-base-content/60">
                    <th className="w-8">#</th>
                    <th>Test Case</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Executed</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults?.map((result, index) => (
                    <ResultRow
                      key={result.id}
                      result={result}
                      index={index + 1}
                      onEdit={() => openEdit(result)}
                      onDelete={() => openDelete(result)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
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
