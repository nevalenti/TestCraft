import { XMarkIcon } from "@heroicons/react/24/solid";
import { useId, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

const SIZE_CLASS = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-2xl",
} as const;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  size?: keyof typeof SIZE_CLASS;
  children: React.ReactNode;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  children,
}: ModalProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [cachedChildren, setCachedChildren] = useState<React.ReactNode>(null);

  if (isOpen && cachedChildren !== children) {
    setCachedChildren(children);
  }

  useLayoutEffect(() => {
    const dialog = ref.current;

    if (isOpen) {
      if (
        document.activeElement instanceof HTMLElement &&
        !dialog?.contains(document.activeElement)
      ) {
        returnFocus.current = document.activeElement;
      }
      dialog?.showModal();
      const initialFocus =
        dialog?.querySelector<HTMLElement>(
          '[autofocus], [data-autofocus="true"]',
        ) ??
        dialog?.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled)',
        );
      initialFocus?.focus();
    } else {
      dialog?.close();
    }

    return () => {
      dialog?.close();
      if (isOpen && returnFocus.current?.isConnected)
        returnFocus.current.focus();
    };
  }, [isOpen]);

  const handleClose = () => {
    if (ref.current?.open) return;
    returnFocus.current?.focus();
    if (isOpen) onClose();
  };

  return (
    <dialog
      ref={ref}
      className="modal modal-bottom sm:modal-middle"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={handleClose}
    >
      <div
        className={cn(
          "modal-box w-full border border-border p-0 shadow-2xl",
          SIZE_CLASS[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-1">
          <div className="min-w-0">
            <h3
              id={titleId}
              className="font-display text-lg font-bold tracking-tight text-base-content"
            >
              {title}
            </h3>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-fg-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="-mt-0.5 -mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-base-content/8 hover:text-base-content"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <XMarkIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 pt-3 pb-5">
          {isOpen ? children : cachedChildren}
        </div>
      </div>
      <div className="modal-backdrop">
        <button
          type="button"
          onClick={onClose}
          tabIndex={-1}
          aria-label="Dismiss dialog"
        >
          close
        </button>
      </div>
    </dialog>
  );
};
