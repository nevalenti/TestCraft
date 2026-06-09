import { ArrowUpTrayIcon, BoltIcon, PlusIcon } from "@heroicons/react/24/solid";
import type { CreateTestRun, TestRun, UpdateTestRun } from "@testcraft/types";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { ResourceCard } from "@/components/ui/ResourceCard";
import { SkeletonGrid } from "@/components/ui/SkeletonGrid";
import { SourceFilter } from "@/components/ui/SourceFilter";
import { useDebounce } from "@/hooks/useDebounce";
import { useModal } from "@/hooks/useModal";
import { useRequiredParam } from "@/hooks/useRequiredParam";
import {
  useCreateTestRun,
  useDeleteTestRun,
  useImportAllure,
  useImportJUnitXml,
  useTestRuns,
  useUpdateTestRun,
} from "@/hooks/useTestRuns";
import { formatDate } from "@/lib/format";
import { ImportForm } from "@/pages/ProjectDetailPage/ImportForm";
import { RunForm } from "@/pages/ProjectDetailPage/RunForm";
import { RunStatusBadge } from "@/pages/ProjectDetailPage/RunStatusBadge";

export const RunsTab = () => {
  const projectId = useRequiredParam("projectId");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { modal, close, openCreate, openEdit, openDelete, openImport } =
    useModal<TestRun>();
  const { data: runs, isPending } = useTestRuns(
    projectId,
    debouncedSearch || undefined,
  );
  const createRun = useCreateTestRun(projectId);
  const updateRun = useUpdateTestRun(projectId);
  const deleteRun = useDeleteTestRun(projectId);
  const importJUnit = useImportJUnitXml(projectId);
  const importAllure = useImportAllure(projectId);

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
      importJUnit.mutate(
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

  const allRuns = runs ?? [];
  const sources = [
    ...new Set(allRuns.map((r) => r.source).filter(Boolean) as string[]),
  ].toSorted();
  const sourceCounts = Object.fromEntries(
    sources.map((src) => [src, allRuns.filter((r) => r.source === src).length]),
  );
  const visibleRuns = sourceFilter
    ? allRuns.filter((r) => r.source === sourceFilter)
    : runs;

  const renderRuns = () => {
    if (isPending) return <SkeletonGrid />;

    if (runs?.length === 0)
      return (
        <EmptyState
          title="No test runs yet"
          description="Start a test run to record and track results."
        />
      );

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleRuns?.map((run) => (
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
              <span className="line-clamp-2 text-base leading-snug font-semibold">
                {run.name}
              </span>
              <p className="text-sm font-medium text-base-content/60">
                {run.environment}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <RunStatusBadge status={run.status} />
                {run.source && (
                  <span className="rounded-full bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/50">
                    {run.source}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-[11px] font-medium text-base-content/40 tabular-nums">
                {formatDate(run.createdAt)}
              </span>
            </div>
          </ResourceCard>
        ))}
      </div>
    );
  };

  return (
    <>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search test runs…"
      >
        <button
          className="btn gap-1.5 btn-sm btn-secondary"
          onClick={openImport}
        >
          <ArrowUpTrayIcon className="size-4" />
          Import
        </button>
        <button className="btn btn-sm btn-primary" onClick={openCreate}>
          <PlusIcon className="size-4" aria-hidden="true" />
          New Run
        </button>
      </ListToolbar>

      <SourceFilter
        sources={sources}
        counts={sourceCounts}
        value={sourceFilter}
        onChange={setSourceFilter}
      />

      {renderRuns()}

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
            isLoading={importJUnit.isPending || importAllure.isPending}
          />
        )}
      </Modal>
    </>
  );
};
