import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import type { CreateLabel, Label, UpdateLabel } from "@testcraft/types";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LabelBadge } from "@/components/ui/LabelBadge";
import { Modal } from "@/components/ui/Modal";
import {
  useCreateLabel,
  useDeleteLabel,
  useLabels,
  useUpdateLabel,
} from "@/hooks/useLabels";
import { useRequiredParam } from "@/hooks/useRequiredParam";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

interface LabelFormValues {
  name: string;
  color: string;
}

interface LabelFormProps {
  defaultValues?: LabelFormValues;
  onSubmit: (data: LabelFormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}

const LabelForm = ({
  defaultValues = { name: "", color: PRESET_COLORS[0] },
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: LabelFormProps) => {
  const { register, handleSubmit, watch, setValue } = useForm<LabelFormValues>({
    defaultValues,
  });
  const color = watch("color");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="label-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="label-name"
          {...register("name", { required: true })}
          className="input-bordered input w-full"
          placeholder="e.g. smoke, regression, flaky"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="label-color-custom" className="text-sm font-medium">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="size-6 rounded-full ring-offset-2 transition-all"
              style={{
                backgroundColor: c,
                boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
              }}
              onClick={() => setValue("color", c)}
              aria-label={c}
            />
          ))}
          <input
            id="label-color-custom"
            type="color"
            {...register("color")}
            className="size-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
            title="Custom color"
          />
        </div>
        <div className="mt-1">
          <LabelBadge
            label={{
              id: "",
              name: watch("name") || "Preview",
              color,
              projectId: "",
              createdAt: "",
            }}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-sm btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-xs loading-spinner" />
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
};

export const LabelsTab = () => {
  const projectId = useRequiredParam("projectId");
  const { data: labels, isPending } = useLabels(projectId);
  const createLabel = useCreateLabel(projectId);
  const updateLabel = useUpdateLabel(projectId);
  const deleteLabel = useDeleteLabel(projectId);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Label | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Label | null>(null);

  const handleCreate = (data: CreateLabel) =>
    createLabel.mutate(data, { onSuccess: () => setCreateOpen(false) });

  const handleUpdate = (data: UpdateLabel) => {
    if (!editTarget) return;
    updateLabel.mutate(
      { id: editTarget.id, ...data },
      { onSuccess: () => setEditTarget(null) },
    );
  };

  const renderLabels = () => {
    if (isPending)
      return (
        <div className="flex min-h-40 items-center justify-center">
          <span className="loading loading-md loading-spinner text-primary" />
        </div>
      );
    if (!labels || labels.length === 0)
      return (
        <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
          <p className="text-sm font-semibold text-base-content/60">
            No labels yet
          </p>
          <p className="text-xs text-base-content/50">
            Create labels to tag test cases.
          </p>
        </div>
      );
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="table table-sm">
          <thead>
            <tr className="text-xs text-base-content/70">
              <th>Label</th>
              <th>Color</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {labels.map((label) => (
              <tr key={label.id} className="group hover:bg-base-200/50">
                <td>
                  <LabelBadge label={label} />
                </td>
                <td>
                  <span className="flex items-center gap-1.5 text-xs text-base-content/60">
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
                      onClick={() => setEditTarget(label)}
                      aria-label="Edit label"
                    >
                      <PencilIcon className="size-3.5" />
                    </button>
                    <button
                      className="btn text-error btn-ghost btn-xs"
                      onClick={() => setDeleteTarget(label)}
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
        <p className="text-sm text-base-content/70">
          Labels let you tag test cases for filtering and reporting.
        </p>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon className="size-4" />
          New Label
        </button>
      </div>

      {renderLabels()}

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Label"
      >
        <LabelForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isLoading={createLabel.isPending}
          submitLabel="Create"
        />
      </Modal>

      <Modal
        isOpen={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Edit Label"
      >
        {editTarget && (
          <LabelForm
            key={editTarget.id}
            defaultValues={{ name: editTarget.name, color: editTarget.color }}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
            isLoading={updateLabel.isPending}
            submitLabel="Save"
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteLabel.mutate(deleteTarget!.id, {
            onSuccess: () => setDeleteTarget(null),
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
