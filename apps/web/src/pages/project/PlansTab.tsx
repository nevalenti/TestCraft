import { PlusIcon } from "@heroicons/react/24/solid";
import { getRouteApi } from "@tanstack/react-router";
import type {
  CreateTestPlan,
  TestPlan,
  UpdateTestPlan,
} from "@testcraft/types";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { ResourceView } from "@/components/ui/resource/ResourceView";
import { useProjectPermissions } from "@/features/projects/permissions";
import {
  useCreateTestPlan,
  useDeleteTestPlan,
  useTestPlansPage,
  useUpdateTestPlan,
} from "@/features/testPlans/hooks";
import { PlanForm } from "@/features/testPlans/PlanForm";
import { PlansTable } from "@/features/testPlans/PlansTable";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";
import { useModal } from "@/hooks/useModal";
import { type SortState } from "@/lib/sort";

const routeApi = getRouteApi("/_app/projects/$projectId/plans");

export const PlansTab = () => {
  const { projectId } = routeApi.useParams();
  const { canEdit } = useProjectPermissions(projectId);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortState<"name" | "date"> | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const {
    data: planPage,
    isPending,
    isError,
    error,
    refetch,
  } = useTestPlansPage(
    projectId,
    page + 1,
    debouncedSearch,
    sort?.key === "name" ? "name" : "created_at",
    sort?.direction ?? "desc",
  );
  const plans = planPage?.items;
  const createPlan = useCreateTestPlan(projectId);
  const updatePlan = useUpdateTestPlan(projectId);
  const deletePlan = useDeleteTestPlan(projectId);
  const { modal, close, openCreate, openEdit, openDelete } =
    useModal<TestPlan>();
  const showSkeleton = useIsLoadingVisible(isPending);

  const handleCreate = (input: CreateTestPlan) =>
    createPlan.mutate(input, { onSuccess: close });
  const handleUpdate = (item: TestPlan) => (input: UpdateTestPlan) =>
    updatePlan.mutate(
      { id: item.id, version: item.version, ...input },
      { onSuccess: close },
    );
  const handleDelete = (id: string) =>
    deletePlan.mutate(id, {
      onSuccess: () => {
        close();
        setPage(0);
      },
    });

  const deleteItem = modal.type === "delete" ? modal.item : null;

  const renderTable = (items: TestPlan[]) => (
    <PlansTable
      plans={items}
      projectId={projectId}
      onEdit={canEdit ? openEdit : undefined}
      onDelete={canEdit ? openDelete : undefined}
      serverPage={page}
      serverPageCount={
        planPage ? Math.ceil(planPage.total / planPage.page_size) : 0
      }
      onServerPageChange={setPage}
      serverSort={sort}
      onServerSortChange={setSort}
    />
  );

  return (
    <>
      <ListToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(0);
        }}
        placeholder="Search test plans…"
      >
        {canEdit && (
          <button className="btn btn-sm btn-primary" onClick={openCreate}>
            <PlusIcon className="size-4" aria-hidden="true" />
            New Test Plan
          </button>
        )}
      </ListToolbar>

      <ResourceView
        isPending={isPending}
        showSkeleton={showSkeleton}
        skeletonLabel="Loading test plans…"
        isError={isError}
        error={error}
        onRetry={refetch}
        items={plans}
        displayItems={plans}
        viewMode="list"
        emptyTitle="No test plans yet"
        emptyDescription="Create a plan to pre-select test cases and run them as a structured suite."
        renderTable={renderTable}
      />

      <Modal
        isOpen={modal.type === "create"}
        onClose={close}
        title="New Test Plan"
      >
        {modal.type === "create" && (
          <PlanForm
            submitLabel="Create"
            onSubmit={handleCreate}
            onCancel={close}
            isLoading={createPlan.isPending}
          />
        )}
      </Modal>

      <Modal
        isOpen={modal.type === "edit"}
        onClose={close}
        title="Edit Test Plan"
      >
        {modal.type === "edit" && (
          <PlanForm
            key={modal.item.id}
            submitLabel="Save"
            defaultValues={{
              name: modal.item.name,
              description: modal.item.description ?? "",
            }}
            onSubmit={handleUpdate(modal.item)}
            onCancel={close}
            isLoading={updatePlan.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={modal.type === "delete"}
        onClose={close}
        onConfirm={() => deleteItem && handleDelete(deleteItem.id)}
        title="Delete Test Plan"
        description={deleteItem ? `Delete "${deleteItem.name}"?` : ""}
        isLoading={deletePlan.isPending}
      />
    </>
  );
};
