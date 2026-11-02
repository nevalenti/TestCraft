import { ArrowUpTrayIcon, PlusIcon } from "@heroicons/react/24/solid";
import { getRouteApi } from "@tanstack/react-router";
import type { CreateTestRun, TestRun, UpdateTestRun } from "@testcraft/types";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { ResourceView } from "@/components/ui/resource/ResourceView";
import { SourceFilter } from "@/components/ui/SourceFilter";
import { useProjectPermissions } from "@/features/projects/permissions";
import {
  useCreateTestRun,
  useDeleteTestRun,
  useImportAllure,
  useImportJUnitXml,
  useTestRuns,
  useUpdateTestRun,
} from "@/features/testRuns/hooks";
import { ImportForm } from "@/features/testRuns/resultImport/ImportForm";
import { RunForm } from "@/features/testRuns/RunForm";
import { RunsTable } from "@/features/testRuns/RunsTable";
import { useRunSources } from "@/features/testRuns/useRunSources";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";
import { useModal } from "@/hooks/useModal";

const routeApi = getRouteApi("/_app/projects/$projectId/runs");

export const RunsTab = () => {
  const { projectId } = routeApi.useParams();
  const { canEdit } = useProjectPermissions(projectId);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { modal, close, openCreate, openEdit, openDelete, openImport } =
    useModal<TestRun>();
  const {
    data: runs,
    isPending,
    isError,
    error,
    refetch,
  } = useTestRuns(projectId, debouncedSearch || undefined);
  const createRun = useCreateTestRun(projectId);
  const updateRun = useUpdateTestRun(projectId);
  const deleteRun = useDeleteTestRun(projectId);
  const importJUnit = useImportJUnitXml(projectId);
  const importAllure = useImportAllure(projectId);
  const showSkeleton = useIsLoadingVisible(isPending);

  const handleCreate = ({ name, environment }: CreateTestRun) =>
    createRun.mutate({ name, environment }, { onSuccess: close });
  const handleUpdate = (item: TestRun) => (input: UpdateTestRun) =>
    updateRun.mutate(
      { id: item.id, version: item.version, ...input },
      { onSuccess: close },
    );
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

  const { sources, sourceCounts, visibleRuns } = useRunSources(
    runs,
    sourceFilter,
  );

  const renderTable = (items: TestRun[]) => (
    <RunsTable
      runs={items}
      projectId={projectId}
      onEdit={canEdit ? openEdit : undefined}
      onDelete={canEdit ? openDelete : undefined}
    />
  );

  return (
    <>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search test runs…"
      >
        {canEdit && (
          <>
            <button
              className="btn gap-1.5 btn-outline btn-sm"
              onClick={openImport}
            >
              <ArrowUpTrayIcon className="size-4" aria-hidden="true" />
              Import
            </button>
            <button className="btn btn-sm btn-primary" onClick={openCreate}>
              <PlusIcon className="size-4" aria-hidden="true" />
              New Test Run
            </button>
          </>
        )}
      </ListToolbar>

      <SourceFilter
        sources={sources}
        counts={sourceCounts}
        value={sourceFilter}
        onChange={setSourceFilter}
      />

      <ResourceView
        isPending={isPending}
        showSkeleton={showSkeleton}
        skeletonLabel="Loading test runs…"
        isError={isError}
        error={error}
        onRetry={refetch}
        items={runs}
        displayItems={visibleRuns}
        viewMode="list"
        emptyTitle="No test runs yet"
        emptyDescription="Start a test run to record and track results."
        renderTable={renderTable}
      />

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
            onSubmit={handleUpdate(modal.item)}
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
