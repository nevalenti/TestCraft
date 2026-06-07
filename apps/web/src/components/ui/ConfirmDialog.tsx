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
    <p className="mb-6 text-base-content/80">{description}</p>
    <div className="flex justify-end gap-2">
      <button type="button" className="btn btn-sm" onClick={onClose}>
        Cancel
      </button>
      <button
        type="button"
        className="btn btn-sm btn-error"
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="loading loading-sm loading-spinner" />
        ) : (
          confirmLabel
        )}
      </button>
    </div>
  </Modal>
);
