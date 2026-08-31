import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import type { CreateLabel, Label, UpdateLabel } from '@testcraft/types';

import { ErrorState } from '@/components/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LabelBadge } from '@/components/ui/LabelBadge';
import { Modal } from '@/components/ui/Modal';
import { SkeletonStatus } from '@/components/ui/SkeletonStatus';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import {
  useCreateLabel,
  useDeleteLabel,
  useLabels,
  useUpdateLabel,
} from '@/features/labels/hooks';
import { LabelForm } from '@/features/labels/LabelForm';
import { useIsLoadingVisible } from '@/hooks/useIsLoadingVisible';
import { useModal } from '@/hooks/useModal';
import { useRequiredParam } from '@/hooks/useRequiredParam';

export const LabelsTab = () => {
  const projectId = useRequiredParam('projectId');
  const {
    data: labels,
    isPending,
    isError,
    error,
    refetch,
  } = useLabels(projectId);
  const createLabel = useCreateLabel(projectId);
  const updateLabel = useUpdateLabel(projectId);
  const deleteLabel = useDeleteLabel(projectId);
  const { modal, close, openCreate, openEdit, openDelete } = useModal<Label>();

  const handleCreate = (data: CreateLabel) =>
    createLabel.mutate(data, { onSuccess: close });

  const handleUpdate = (data: UpdateLabel) => {
    if (modal.type !== 'edit') return;
    updateLabel.mutate({ id: modal.item.id, ...data }, { onSuccess: close });
  };

  const deleteTarget = modal.type === 'delete' ? modal.item : null;
  const showSkeleton = useIsLoadingVisible(isPending);

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
        <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
          <p className="text-sm font-semibold text-base-content/75">
            No labels yet
          </p>
          <p className="text-xs text-base-content/65">
            Create labels to tag test cases.
          </p>
        </div>
      );
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="table table-sm">
          <thead>
            <tr className="text-xs text-base-content/85">
              <th>Label</th>
              <th>Color</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {labels.map((label) => (
              <tr key={label.id} className="group hover:bg-base-300">
                <td>
                  <LabelBadge label={label} />
                </td>
                <td>
                  <span className="flex items-center gap-1.5 text-xs text-base-content/75">
                    <span
                      className="inline-block size-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.color}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => openEdit(label)}
                      aria-label="Edit label"
                    >
                      <PencilIcon className="size-3.5" />
                    </button>
                    <button
                      className="btn text-error btn-ghost btn-xs"
                      onClick={() => openDelete(label)}
                      aria-label="Delete label"
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-base-content/85">
          Labels let you tag test cases for filtering and reporting.
        </p>
        <button className="btn btn-sm btn-primary" onClick={openCreate}>
          <PlusIcon className="size-4" />
          New Label
        </button>
      </div>

      {renderLabels()}

      <Modal isOpen={modal.type === 'create'} onClose={close} title="New Label">
        <LabelForm
          onSubmit={handleCreate}
          onCancel={close}
          isLoading={createLabel.isPending}
          submitLabel="Create"
        />
      </Modal>

      <Modal isOpen={modal.type === 'edit'} onClose={close} title="Edit Label">
        {modal.type === 'edit' && (
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
        isOpen={modal.type === 'delete'}
        onClose={close}
        onConfirm={() =>
          deleteTarget &&
          deleteLabel.mutate(deleteTarget.id, { onSuccess: close })
        }
        title="Delete label"
        description={`"${deleteTarget?.name}" will be permanently removed and untagged from all test cases.`}
        confirmLabel="Delete"
        isLoading={deleteLabel.isPending}
      />
    </div>
  );
};
