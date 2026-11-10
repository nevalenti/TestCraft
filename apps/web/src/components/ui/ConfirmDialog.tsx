import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";

import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmIcon?: ReactNode;
  confirmClassName?: string;
  isLoading?: boolean;
  tone?: "danger" | "neutral";
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  confirmIcon,
  confirmClassName,
  isLoading,
  tone = "danger",
}: ConfirmDialogProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex gap-3">
      {tone === "danger" && (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--color-error)_12%,var(--color-base-100))] text-error">
          <ExclamationTriangleIcon className="size-4.5" aria-hidden="true" />
        </span>
      )}
      <p className="pt-1.5 text-sm leading-relaxed text-fg-secondary">
        {description}
      </p>
    </div>
    <div className="mt-6 flex justify-end gap-2">
      <button
        type="button"
        className="btn text-fg-secondary btn-ghost btn-sm"
        onClick={onClose}
      >
        Cancel
      </button>
      <button
        type="button"
        className={cn(
          "btn min-w-20 gap-2 btn-sm",
          confirmClassName ?? (tone === "danger" ? "btn-error" : "btn-primary"),
        )}
        onClick={onConfirm}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading && (
          <span
            className="loading loading-sm loading-spinner"
            aria-hidden="true"
          />
        )}
        {!isLoading && confirmIcon}
        {confirmLabel}
      </button>
    </div>
  </Modal>
);
