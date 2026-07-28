import { useCallback, useState } from 'react';

import type { ModalState } from '@/types';

export const useModal = <T>() => {
  const [modal, setModal] = useState<ModalState<T>>({ type: 'closed' });
  const close = useCallback(() => setModal({ type: 'closed' }), []);
  const openCreate = useCallback(() => setModal({ type: 'create' }), []);
  const openImport = useCallback(() => setModal({ type: 'import' }), []);
  const openEdit = useCallback(
    (item: T) => setModal({ type: 'edit', item }),
    [],
  );
  const openDelete = useCallback(
    (item: T) => setModal({ type: 'delete', item }),
    [],
  );

  return { modal, close, openCreate, openImport, openEdit, openDelete };
};
