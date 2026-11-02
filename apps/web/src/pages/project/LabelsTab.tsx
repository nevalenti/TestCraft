import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { getRouteApi } from "@tanstack/react-router";
import type { CreateLabel, Label, UpdateLabel } from "@testcraft/types";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LabelBadge } from "@/components/ui/LabelBadge";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Modal } from "@/components/ui/Modal";
import { SkeletonStatus } from "@/components/ui/skeleton/SkeletonStatus";
import { TableSkeleton } from "@/components/ui/skeleton/TableSkeleton";
import { TablePager } from "@/components/ui/TablePager";
import {
  useCreateLabel,
  useDeleteLabel,
  useLabelsPage,
  useUpdateLabel,
} from "@/features/labels/hooks";
import { LabelForm } from "@/features/labels/LabelForm";
import { useProjectPermissions } from "@/features/projects/permissions";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";
import { useModal } from "@/hooks/useModal";

const routeApi = getRouteApi("/_app/projects/$projectId/labels");

export const LabelsTab = () => {
  const { projectId } = routeApi.useParams();
  const { canEdit } = useProjectPermissions(projectId);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(0);
  const {
    data: labelPage,
    isPending,
    isError,
    error,
    refetch,
  } = useLabelsPage(projectId, page + 1, debouncedSearch);
  const labels = labelPage?.items;
  const createLabel = useCreateLabel(projectId);
  const updateLabel = useUpdateLabel(projectId);
  const deleteLabel = useDeleteLabel(projectId);
  const { modal, close, openCreate, openEdit, openDelete } = useModal<Label>();

  const handleCreate = (data: CreateLabel) =>
    createLabel.mutate(data, { onSuccess: close });

  const handleUpdate = (data: UpdateLabel) => {
    if (modal.type !== "edit") return;
    updateLabel.mutate(
      { id: modal.item.id, version: modal.item.version, ...data },
      { onSuccess: close },
    );
  };

  const deleteTarget = modal.type === "delete" ? modal.item : null;
  const showSkeleton = useIsLoadingVisible(isPending);
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const renderLabels = () => {
    if (isPending)
      return (
        showSkeleton && (
          <SkeletonStatus label="Loading labels…">
            <TableSkeleton columns={3} rows={4} />
          </SkeletonStatus>
        )
      );
    if (isError) return <ErrorState error={error} onRetry={refetch} />;
    if (!labels || labels.length === 0)
      return (
        <EmptyState
          title="No labels yet"
          description="Create labels to tag test cases."
        />
      );
    return (
      <div className="table-shell">
        <div className="overflow-x-auto">
          <table className="table table-stack table-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold tracking-wider text-fg-muted uppercase">
                <th>Label</th>
                <th>Color</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {labels.map((label) => (
                <tr
                  key={label.id}
                  className="group border-b border-border/60 transition-colors last:border-b-0 hover:bg-base-300"
                >
                  <td>
                    <LabelBadge label={label} />
                  </td>
                  <td>
                    <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                      <span
                        className="inline-block size-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.color}
                    </span>
                  </td>
                  <td>
                    {canEdit && (
                      <div
                        data-actions
                        className="flex justify-end gap-0.5 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                      >
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => openEdit(label)}
                          aria-label="Edit label"
                        >
                          <PencilIcon className="size-3.5" />
                        </button>
                        <button
                          className="btn text-fg-subtle btn-ghost btn-xs hover:bg-error/10 hover:text-error"
                          onClick={() => openDelete(label)}
                          aria-label="Delete label"
                        >
                          <TrashIcon className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePager
          page={page}
          pageCount={
            labelPage ? Math.ceil(labelPage.total / labelPage.page_size) : 0
          }
          onPageChange={setPage}
        />
      </div>
    );
  };

  return (
    <div>
      <ListToolbar
        search={search}
        onSearch={handleSearch}
        placeholder="Search labels…"
      >
        {canEdit && (
          <button className="btn btn-sm btn-primary" onClick={openCreate}>
            <PlusIcon className="size-4" />
            New Label
          </button>
        )}
      </ListToolbar>

      {renderLabels()}

      <Modal isOpen={modal.type === "create"} onClose={close} title="New Label">
        <LabelForm
          onSubmit={handleCreate}
          onCancel={close}
          isLoading={createLabel.isPending}
          submitLabel="Create"
        />
      </Modal>

      <Modal isOpen={modal.type === "edit"} onClose={close} title="Edit Label">
        {modal.type === "edit" && (
          <LabelForm
            key={modal.item.id}
            defaultValues={{ name: modal.item.name, color: modal.item.color }}
            onSubmit={handleUpdate}
            onCancel={close}
            isLoading={updateLabel.isPending}
            submitLabel="Save"
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={modal.type === "delete"}
        onClose={close}
        onConfirm={() =>
          deleteTarget &&
          deleteLabel.mutate(deleteTarget.id, {
            onSuccess: () => {
              close();
              setPage(0);
            },
          })
        }
        title="Delete label"
        description={`"${deleteTarget?.name}" will be permanently removed and untagged from all test cases.`}
        confirmLabel="Delete"
        isLoading={deleteLabel.isPending}
      />
    </div>
  );
};
