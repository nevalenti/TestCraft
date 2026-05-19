import { forwardRef, useImperativeHandle, useState } from "react";
import { Link } from "react-router";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { type ViewMode, ViewToggle } from "@/components/ui/ViewToggle";
import {
  useCreateTestRun,
  useDeleteTestRun,
  useTestRuns,
  useUpdateTestRun,
} from "@/hooks/useTestRuns";
import { formatDate } from "@/lib/format";
import type {
  CreateTestRunDto,
  ModalState,
  TestRunDto,
  UpdateTestRunDto,
} from "@/types";

import { RunForm } from "./RunForm";
import type { TabHandle } from "./TabHandle";

export const RunsTab = forwardRef<TabHandle, { projectId: string }>(
  ({ projectId }, ref) => {
    const [modal, setModal] = useState<ModalState<TestRunDto>>({
      type: "closed",
    });
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const { data: runs, isPending } = useTestRuns(projectId);
    const createRun = useCreateTestRun(projectId);
    const updateRun = useUpdateTestRun(projectId);
    const deleteRun = useDeleteTestRun(projectId);
    const close = () => setModal({ type: "closed" });

    useImperativeHandle(ref, () => ({
      open: () => setModal({ type: "create" }),
    }));

    const handleCreate = (dto: CreateTestRunDto) =>
      createRun.mutate(dto, { onSuccess: close });
    const handleUpdate = (id: string) => (dto: UpdateTestRunDto) =>
      updateRun.mutate({ id, ...dto }, { onSuccess: close });
    const handleDelete = (id: string) =>
      deleteRun.mutate(id, { onSuccess: close });
    const hasItems = !isPending && (runs?.length ?? 0) > 0;

    return (
      <>
        <div className="min-h-80">
          <div
            className={`mb-4 flex justify-end ${!hasItems ? "invisible pointer-events-none" : ""}`}
          >
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>
          {isPending ? (
            <SkeletonGrid />
          ) : runs?.length === 0 ? (
            <EmptyState
              title="No test runs yet"
              description="Start a test run to record and track results."
              action={
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setModal({ type: "create" })}
                >
                  New Run
                </button>
              }
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {runs?.map((run) => (
                <div
                  key={run.id}
                  className="relative bg-base-100 border border-border border-l-4 border-l-primary shadow-sm transition-all duration-150 hover:shadow-md group overflow-hidden"
                >
                  <div className="p-5 flex flex-row gap-4 items-stretch">
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex flex-col gap-1.5">
                        <Link
                          to={`/projects/${projectId}/runs/${run.id}`}
                          className="text-[15px] font-semibold leading-snug line-clamp-2 transition-colors hover:text-primary"
                        >
                          {run.name}
                        </Link>
                        <p className="text-base-content/45 text-sm font-medium">
                          {run.environment}
                        </p>
                      </div>
                      <p className="text-base-content/35 mt-3 text-xs tabular-nums">
                        {formatDate(run.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setModal({ type: "edit", item: run })}
                        aria-label="Edit run"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => setModal({ type: "delete", item: run })}
                        aria-label="Delete run"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-border overflow-hidden">
              {runs?.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-b-0 border-l-4 border-l-primary bg-base-100 group hover:bg-base-200/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/projects/${projectId}/runs/${run.id}`}
                      className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1"
                    >
                      {run.name}
                    </Link>
                    <p className="text-xs text-base-content/45 mt-0.5">
                      {run.environment}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-xs text-base-content/35 tabular-nums hidden sm:block">
                      {formatDate(run.createdAt)}
                    </p>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => setModal({ type: "edit", item: run })}
                        aria-label="Edit run"
                      >
                        <PencilIcon size="size-3.5" />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => setModal({ type: "delete", item: run })}
                        aria-label="Delete run"
                      >
                        <TrashIcon size="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal
          isOpen={modal.type === "create"}
          onClose={close}
          title="New Test Run"
        >
          <RunForm
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createRun.isPending}
          />
        </Modal>
        {modal.type === "edit" && (
          <Modal isOpen onClose={close} title="Edit Test Run">
            <RunForm
              key={modal.item.id}
              defaultValues={{
                name: modal.item.name,
                environment: modal.item.environment,
              }}
              onSubmit={handleUpdate(modal.item.id)}
              onCancel={close}
              isLoading={updateRun.isPending}
            />
          </Modal>
        )}
        {modal.type === "delete" && (
          <ConfirmDialog
            isOpen
            onClose={close}
            onConfirm={() => handleDelete(modal.item.id)}
            title="Delete Test Run"
            description={`Delete "${modal.item.name}"?`}
            isLoading={deleteRun.isPending}
          />
        )}
      </>
    );
  },
);
RunsTab.displayName = "RunsTab";
