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
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setCachedChildren(children);
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
      <div className="modal-box">
        <button
          type="button"
          className="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <XMarkIcon className="size-4" aria-hidden="true" />
        </button>
        <h3 className="mb-4 text-lg font-bold">{title}</h3>
        {isOpen ? children : cachedChildren}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};
