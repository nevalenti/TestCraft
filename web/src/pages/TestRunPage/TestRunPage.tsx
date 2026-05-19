import { useMemo, useState } from "react";
import { useParams } from "react-router";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useProject } from "@/hooks/useProjects";
import {
  useCreateTestResult,
  useDeleteTestResult,
  useTestResults,
  useUpdateTestResult,
} from "@/hooks/useTestResults";
import { useTestRun } from "@/hooks/useTestRuns";
import {
  type CreateTestResultDto,
  type ModalState,
  statusOptions,
  type TestResultDto,
  TestResultStatus,
  type UpdateTestResultDto,
} from "@/types";

import { statusBorderClass } from "./constants";
import { CreateResultForm } from "./CreateResultForm";
import { ResultRow } from "./ResultRow";
import { UpdateResultForm } from "./UpdateResultForm";

export const TestRunPage = () => {
  const { projectId, runId } = useParams<{
    projectId: string;
    runId: string;
  }>();
  const [modal, setModal] = useState<ModalState<TestResultDto>>({
    type: "closed",
  });

  const { data: project } = useProject(projectId!);
  const { data: run } = useTestRun(projectId!, runId!);
  const { data: results, isPending } = useTestResults(projectId!, runId!);
  const createResult = useCreateTestResult(projectId!, runId!);
  const updateResult = useUpdateTestResult(projectId!, runId!);
  const deleteResult = useDeleteTestResult(projectId!, runId!);
  const close = () => setModal({ type: "closed" });

  const handleCreate = (dto: CreateTestResultDto) =>
    createResult.mutate(dto, { onSuccess: close });
  const handleUpdate = (id: string) => (dto: UpdateTestResultDto) =>
    updateResult.mutate({ id, ...dto }, { onSuccess: close });
  const handleDelete = (id: string) =>
    deleteResult.mutate(id, { onSuccess: close });

  const statusCounts = useMemo(() => {
    if (!results) return undefined;
    return results.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<TestResultStatus, number>,
    );
  }, [results]);

  useBreadcrumbs([
    { label: "home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}` },
    { label: run?.name ?? "…" },
  ]);

  return (
    <div className="w-full flex flex-col">
      <header className="page-header flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{run?.name}</h1>
          {run?.environment && (
            <p className="mt-0.5 text-sm text-base-content/45 font-medium">
              {run.environment}
            </p>
          )}
        </div>
        <button
          className="btn btn-primary btn-sm shrink-0"
          onClick={() => setModal({ type: "create" })}
        >
          Add Result
        </button>
      </header>

      <section className="page-content flex-1">
        {statusCounts && results && results.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {statusOptions.map(({ value }) =>
              statusCounts[value] ? (
                <div
                  key={value}
                  className={`bg-base-100 border border-border border-l-4 ${statusBorderClass[value]} flex items-center gap-2.5 px-3 py-1.5 text-sm shadow-sm`}
                >
                  <StatusBadge status={value} />
                  <span className="font-bold text-base-content/60 tabular-nums text-sm">
                    {statusCounts[value]}
                  </span>
                </div>
              ) : null,
            )}
          </div>
        )}

        <div className="min-h-80">
          {isPending ? (
            <SkeletonGrid />
          ) : results?.length === 0 ? (
            <EmptyState
              title="No results recorded"
              description="Add results to track the outcome of each test case in this run."
              action={
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setModal({ type: "create" })}
                >
                  Add Result
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results?.map((result) => (
                <ResultRow
                  key={result.id}
                  result={result}
                  onEdit={() => setModal({ type: "edit", item: result })}
                  onDelete={() => setModal({ type: "delete", item: result })}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {modal.type === "create" && (
        <Modal isOpen onClose={close} title="Add Test Result">
          <CreateResultForm
            projectId={projectId!}
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createResult.isPending}
          />
        </Modal>
      )}
      {modal.type === "edit" && (
        <Modal isOpen onClose={close} title="Edit Result">
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
        </Modal>
      )}
      {modal.type === "delete" && (
        <ConfirmDialog
          isOpen
          onClose={close}
          onConfirm={() => handleDelete(modal.item.id)}
          title="Delete Result"
          description="Delete this test result?"
          isLoading={deleteResult.isPending}
        />
      )}
    </div>
  );
};
