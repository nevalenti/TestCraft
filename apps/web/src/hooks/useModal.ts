import { useState } from "react";

import type { ModalState } from "@/types";

export const useModal = <T>() => {
  const [modal, setModal] = useState<ModalState<T>>({ type: "closed" });
  const close = () => setModal({ type: "closed" });
  const openCreate = () => setModal({ type: "create" });
  const openImport = () => setModal({ type: "import" });
  const openEdit = (item: T) => setModal({ type: "edit", item });
  const openDelete = (item: T) => setModal({ type: "delete", item });
  return { modal, close, openCreate, openImport, openEdit, openDelete };
};
