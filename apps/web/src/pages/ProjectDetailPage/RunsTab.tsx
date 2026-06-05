import { ArrowUpTrayIcon, BoltIcon, PlusIcon } from "@heroicons/react/24/solid";
import type { CreateTestRun, TestRun, UpdateTestRun } from "@testcraft/types";
import { forwardRef, useImperativeHandle, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ResourceCard } from "@/components/ui/ResourceCard";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/hooks/useModal";
import {
  useCreateTestRun,
  useDeleteTestRun,
  useImportAllure,
  useImportJunitXml,
  useTestRuns,
  useUpdateTestRun,
} from "@/hooks/useTestRuns";
import { formatDate } from "@/lib/format";
import { ImportForm } from "@/pages/ProjectDetailPage/ImportForm";
import { RunForm } from "@/pages/ProjectDetailPage/RunForm";
import { RunStatusBadge } from "@/pages/ProjectDetailPage/RunStatusBadge";
import type { TabHandle } from "@/pages/ProjectDetailPage/TabHandle";

export const RunsSection = forwardRef<TabHandle, { projectId: string }>(
  ({ projectId }, ref) => {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const { modal, close, openCreate, openImport, openEdit, openDelete } =
      useModal<TestRun>();
    const { data: runs, isPending } = useTestRuns(
      projectId,
      debouncedSearch || undefined,
    );
    const createRun = useCreateTestRun(projectId);
    const updateRun = useUpdateTestRun(projectId);
    const deleteRun = useDeleteTestRun(projectId);
    const importJunit = useImportJunitXml(projectId);
    const importAllure = useImportAllure(projectId);

    useImperativeHandle(ref, () => ({ open: openCreate }));

    const handleCreate = (input: CreateTestRun) =>
      createRun.mutate(input, { onSuccess: close });
    const handleUpdate = (id: string) => (input: UpdateTestRun) =>
      updateRun.mutate({ id, ...input }, { onSuccess: close });
    const handleDelete = (id: string) =>
      deleteRun.mutate(id, { onSuccess: close });
    const handleImport: React.ComponentProps<typeof ImportForm>["onSubmit"] = (
      data,
    ) => {
      if (data.type === "junit") {
        importJunit.mutate(
          { xml: data.xml, environment: data.environment, name: data.name },
          { onSuccess: close },
        );
      } else {
        importAllure.mutate(
          {
            results: data.results,
            environment: data.environment,
            name: data.name,
          },
          { onSuccess: close },
        );
      }
    };

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
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary btn-sm" onClick={openCreate}>
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-white/35 text-black">
                    <PlusIcon className="size-3" aria-hidden="true" />
                  </span>
                  Create First Run
                </button>
                <button
                  className="btn btn-outline btn-sm gap-1.5"
                  onClick={openImport}
                >
                  <ArrowUpTrayIcon className="size-4" />
                  Import
                </button>
              </div>
            }
          />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <input
                type="search"
                className="input input-bordered bg-base-200 w-full max-w-sm"
                placeholder="Search test runs…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                className="btn btn-outline btn-sm gap-1.5 shrink-0"
                onClick={openImport}
              >
                <ArrowUpTrayIcon className="size-4" />
                Import
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {runs?.map((run) => (
                <ResourceCard
                  key={run.id}
                  testId="run-card"
                  onEdit={() => openEdit(run)}
                  onDelete={() => openDelete(run)}
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
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <RunStatusBadge status={run.status} />
                    <p className="text-base-content/50 text-xs tabular-nums">
                      {formatDate(run.createdAt)}
                    </p>
                  </div>
                </ResourceCard>
              ))}
            </div>
          </>
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
        <Modal
          isOpen={modal.type === "import"}
          onClose={close}
          title="Import Test Results"
        >
          {modal.type === "import" && (
            <ImportForm
              onSubmit={handleImport}
              onCancel={close}
              isLoading={importJunit.isPending || importAllure.isPending}
            />
          )}
        </Modal>
      </>
    );
  },
);
RunsSection.displayName = "RunsSection";
