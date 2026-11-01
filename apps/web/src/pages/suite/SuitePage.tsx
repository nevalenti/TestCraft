import { PlusIcon } from "@heroicons/react/24/solid";
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
import { PageHeader } from "@/components/ui/PageHeader";
import { ResourceView } from "@/components/ui/resource/ResourceView";
import { useProject } from "@/features/projects/hooks";
import { useProjectPermissions } from "@/features/projects/permissions";
import { CaseForm } from "@/features/testCases/CaseForm";
import { CasesTable } from "@/features/testCases/CasesTable";
import {
  useCreateTestCase,
  useDeleteTestCase,
  useTestCases,
  useUpdateTestCase,
} from "@/features/testCases/hooks";
import { useTestSuite } from "@/features/testSuites/hooks";
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
  const { modal, close, openCreate, openEdit, openDelete } =
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
  const showSkeleton = useIsLoadingVisible(isPending);

  const handleCreate = (input: CreateTestCase) =>
    createCase.mutate(input, { onSuccess: close });
  const handleUpdate = (item: TestCase) => (input: UpdateTestCase) =>
    updateCase.mutate(
      { id: item.id, version: item.version, ...input },
      { onSuccess: close },
    );
  const handleDelete = (id: string) =>
    deleteCase.mutate(id, { onSuccess: close });

  useBreadcrumbs([
    { label: "Projects", href: "/projects" },
    { label: project?.name ?? "…", href: `/projects/${projectId}/suites` },
    { label: suite?.name ?? "…" },
  ]);

  const deleteItem = modal.type === "delete" ? modal.item : null;

  const renderTable = (items: TestCase[]) => (
    <CasesTable
      testCases={items}
      projectId={projectId}
      suiteId={suiteId}
      onEdit={canEdit ? openEdit : undefined}
      onDelete={canEdit ? openDelete : undefined}
    />
  );

  return (
    <div className="flex min-h-0 w-full flex-col">
      <PageHeader
        title={suite?.name ?? "…"}
        description={suite?.description}
        meta={
          testCases && (
            <span>
              {testCases.length} test case{testCases.length === 1 ? "" : "s"}
            </span>
          )
        }
        backTo={{
          to: "/projects/$projectId/suites",
          params: { projectId },
        }}
        backLabel={project?.name ?? "Suites"}
        actions={
          canEdit && (
            <button className="btn btn-sm btn-primary" onClick={openCreate}>
              <PlusIcon className="size-4" aria-hidden="true" />
              New Test Case
            </button>
          )
        }
      />
      <section className="page-content min-h-0 flex-1 overflow-y-auto">
        <ListToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search test cases…"
        />
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
            emptyDescription="Add test cases to document expected behavior."
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
      <ConfirmDialog
        isOpen={modal.type === "delete"}
        onClose={close}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        title="Delete Test Case"
        description={deleteItem ? `Delete "${deleteItem.name}"?` : ""}
        isLoading={deleteCase.isPending}
      />
    </div>
  );
};
