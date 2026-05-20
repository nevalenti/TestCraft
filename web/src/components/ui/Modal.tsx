import { useLayoutEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const childCache = useRef<React.ReactNode>(null);
  const isProgrammatic = useRef(false);

  if (isOpen) {
    childCache.current = children;
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
      ref.current?.close();
      isProgrammatic.current = false;
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!isProgrammatic.current) {
      onClose();
    }
  };

  return (
    <dialog ref={ref} className="modal" onClose={handleClose}>
      <div className="modal-box">
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="mb-4 text-lg font-bold">{title}</h3>
        {childCache.current}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};
