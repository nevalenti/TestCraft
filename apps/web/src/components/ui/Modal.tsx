import { XMarkIcon } from "@heroicons/react/24/solid";
import { useLayoutEffect, useRef, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const isProgrammatic = useRef(false);
  const [cachedChildren, setCachedChildren] = useState<React.ReactNode>(null);

  if (isOpen && cachedChildren !== children) {
    setCachedChildren(children);
  }

  useLayoutEffect(() => {
    const dialog = ref.current;

    if (isOpen) {
      dialog?.showModal();
    } else {
      isProgrammatic.current = true;
      dialog?.close();
      isProgrammatic.current = false;
    }

    return () => {
      isProgrammatic.current = true;
      dialog?.close();
      isProgrammatic.current = false;
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!isProgrammatic.current) onClose();
  };

  return (
    <dialog ref={ref} className="modal" onClose={handleClose}>
      <div className="modal-box max-w-md p-0">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h3 className="text-base font-semibold text-base-content">{title}</h3>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-lg text-base-content/65 transition-colors hover:bg-base-200 hover:text-base-content"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <XMarkIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 pt-2 pb-5">
          {isOpen ? children : cachedChildren}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};
