import { Modal } from "@/components/ui/Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  isLoading,
}: ConfirmDialogProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <p className="text-base-content/80 mb-6">{description}</p>
    <div className="flex justify-end gap-2">
      <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
        Cancel
      </button>
      <button
        type="button"
        className="btn btn-error btn-sm"
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          confirmLabel
        )}
      </button>
    </div>
  </Modal>
);
