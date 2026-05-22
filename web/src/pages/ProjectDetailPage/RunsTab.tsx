import { BoltIcon, PlusIcon } from "@heroicons/react/24/solid";
import { forwardRef, useImperativeHandle, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ResourceCard } from "@/components/ui/ResourceCard";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
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
import type { SectionHandle } from "./SuitesTab";

export const RunsSection = forwardRef<SectionHandle, { projectId: string }>(
  ({ projectId }, ref) => {
    const [modal, setModal] = useState<ModalState<TestRunDto>>({
      type: "closed",
    });
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

    const deleteItem = modal.type === "delete" ? modal.item : null;

    return (
      <>
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
                <PlusIcon className="size-4" />
                Create First Run
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {runs?.map((run) => (
              <ResourceCard
                key={run.id}
                onEdit={() => setModal({ type: "edit", item: run })}
                onDelete={() => setModal({ type: "delete", item: run })}
                to={`/projects/${projectId}/runs/${run.id}`}
                label="test run"
                cardBg="card-bg-warning"
                accentText="text-warning"
                typeIcon={<BoltIcon className="size-3.5" />}
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-base font-semibold leading-snug line-clamp-2">
                    {run.name}
                  </span>
                  <p className="text-base-content/60 text-sm font-medium">
                    {run.environment}
                  </p>
                </div>
                <p className="text-base-content/50 mt-3 text-xs tabular-nums">
                  {formatDate(run.createdAt)}
                </p>
              </ResourceCard>
            ))}
          </div>
        )}

        <Modal
          isOpen={modal.type === "create"}
          onClose={close}
          title="New Test Run"
        >
          {modal.type === "create" && (
            <RunForm
              onSubmit={handleCreate}
              onCancel={close}
              isLoading={createRun.isPending}
            />
          )}
        </Modal>
        <Modal
          isOpen={modal.type === "edit"}
          onClose={close}
          title="Edit Test Run"
        >
          {modal.type === "edit" && (
            <RunForm
              key={modal.item.id}
              defaultValues={{
                name: modal.item.name,
                environment: modal.item.environment,
                status: modal.item.status,
              }}
              onSubmit={handleUpdate(modal.item.id)}
              onCancel={close}
              isLoading={updateRun.isPending}
            />
          )}
        </Modal>
        <ConfirmDialog
          isOpen={modal.type === "delete"}
          onClose={close}
          onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
          title="Delete Test Run"
          description={deleteItem ? `Delete "${deleteItem.name}"?` : ""}
          isLoading={deleteRun.isPending}
        />
      </>
    );
  },
);
RunsSection.displayName = "RunsSection";
