import { DocumentPlusIcon } from "@heroicons/react/24/solid";
import { getRouteApi } from "@tanstack/react-router";
import type {
  CreateTestCase,
  TestCase,
  UpdateTestCase,
} from "@testcraft/types";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { ResourceView } from "@/components/ui/resource/ResourceView";
import { CopyForm } from "@/features/copy/CopyForm";
import { useProject } from "@/features/projects/hooks";
import { useProjectPermissions } from "@/features/projects/permissions";
import { CaseForm } from "@/features/testCases/CaseForm";
import { CasesTable } from "@/features/testCases/CasesTable";
import {
  useCloneTestCase,
  useCreateTestCase,
  useDeleteTestCase,
  useTestCases,
  useUpdateTestCase,
} from "@/features/testCases/hooks";
import { useTestSuite, useTestSuites } from "@/features/testSuites/hooks";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";
import { useModal } from "@/hooks/useModal";

const routeApi = getRouteApi("/_app/projects/$projectId_/suites/$suiteId");

export const SuitePage = () => {
  const { projectId, suiteId } = routeApi.useParams();
  const { canEdit } = useProjectPermissions(projectId);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { modal, close, openCreate, openEdit, openCopy, openDelete } =
    useModal<TestCase>();

  const { data: project } = useProject(projectId);
  const { data: suite } = useTestSuite(projectId, suiteId);
  const {
    data: testCases,
    isPending,
    isError,
    error,
    refetch,
  } = useTestCases(projectId, suiteId, debouncedSearch || undefined);
  const createCase = useCreateTestCase(projectId, suiteId);
  const updateCase = useUpdateTestCase(projectId, suiteId);
  const deleteCase = useDeleteTestCase(projectId, suiteId);
  const cloneCase = useCloneTestCase(projectId, suiteId);
  const { data: suites } = useTestSuites(projectId);
  const showSkeleton = useIsLoadingVisible(isPending);

  const handleCreate = (input: CreateTestCase) =>
    createCase.mutate(input, { onSuccess: close });
  const handleUpdate = (item: TestCase) => (input: UpdateTestCase) =>
    updateCase.mutate(
      { id: item.id, version: item.version, ...input },
      { onSuccess: close },
    );
  const handleCopy =
    (item: TestCase) => (values: { name?: string; target?: string }) =>
      cloneCase.mutate(
        { id: item.id, name: values.name, target_suite_id: values.target },
        { onSuccess: close },
      );
  const handleDelete = (item: TestCase) =>
    deleteCase.mutate({ id: item.id, name: item.name }, { onSuccess: close });

  useBreadcrumbs([
    { label: "Projects", href: "/projects" },
    { label: project?.name, href: `/projects/${projectId}/suites` },
    { label: suite?.name },
  ]);

  const deleteItem = modal.type === "delete" ? modal.item : null;

  const renderTable = (items: TestCase[]) => (
    <CasesTable
      testCases={items}
      projectId={projectId}
      suiteId={suiteId}
      onEdit={canEdit ? openEdit : undefined}
      onCopy={canEdit ? openCopy : undefined}
      onDelete={canEdit ? openDelete : undefined}
    />
  );

  return (
    <div className="flex min-h-0 w-full flex-col">
      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <ListToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search test cases…"
        >
          {canEdit && (
            <button className="btn btn-sm btn-primary" onClick={openCreate}>
              <DocumentPlusIcon className="size-4" aria-hidden="true" />
              New Test Case
            </button>
          )}
        </ListToolbar>
        <div className="min-h-80">
          <ResourceView
            isPending={isPending}
            showSkeleton={showSkeleton}
            skeletonLabel="Loading test cases…"
            isError={isError}
            error={error}
            onRetry={refetch}
            items={testCases}
            viewMode="list"
            emptyTitle="No test cases yet"
            renderTable={renderTable}
          />
        </div>
      </section>

      <Modal
        isOpen={modal.type === "create"}
        onClose={close}
        title="New Test Case"
      >
        {modal.type === "create" && (
          <CaseForm
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createCase.isPending}
          />
        )}
      </Modal>
      <Modal
        isOpen={modal.type === "edit"}
        onClose={close}
        title="Edit Test Case"
      >
        {modal.type === "edit" && (
          <CaseForm
            key={modal.item.id}
            defaultValues={{
              name: modal.item.name,
              description: modal.item.description ?? "",
              priority: modal.item.priority,
            }}
            onSubmit={handleUpdate(modal.item)}
            onCancel={close}
            isLoading={updateCase.isPending}
          />
        )}
      </Modal>
      <Modal
        isOpen={modal.type === "copy"}
        onClose={close}
        title="Copy Test Case"
      >
        {modal.type === "copy" && (
          <CopyForm
            key={modal.item.id}
            target={{
              label: "Copy to suite",
              defaultValue: suiteId,
              options: (suites ?? []).map((entry) => ({
                value: entry.id,
                label: entry.name,
              })),
            }}
            onSubmit={handleCopy(modal.item)}
            onCancel={close}
            isLoading={cloneCase.isPending}
          />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={modal.type === "delete"}
        onClose={close}
        onConfirm={() => deleteItem && handleDelete(deleteItem)}
        title="Delete Test Case"
        description={deleteItem ? `Delete "${deleteItem.name}"?` : ""}
        isLoading={deleteCase.isPending}
      />
    </div>
  );
};
