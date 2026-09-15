import type {
  CreateTestResult,
  TestResult,
  UpdateTestResult,
} from '@testcraft/types';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { CreateResultForm } from '@/features/testResults/CreateResultForm';
import { UpdateResultForm } from '@/features/testResults/UpdateResultForm';
import type { ModalState } from '@/hooks/useModal';

export const ResultModals = ({
  modal,
  close,
  projectId,
  onCreate,
  onUpdate,
  onDelete,
  isCreating,
  isUpdating,
  isDeleting,
}: {
  modal: ModalState<TestResult>;
  close: () => void;
  projectId: string;
  onCreate: (input: CreateTestResult) => void;
  onUpdate: (id: string) => (input: UpdateTestResult) => void;
  onDelete: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}) => {
  const deleteItem = modal.type === 'delete' ? modal.item : null;

  return (
    <>
      <Modal
        isOpen={modal.type === 'create'}
        onClose={close}
        title="Add Test Result"
      >
        {modal.type === 'create' && (
          <CreateResultForm
            projectId={projectId}
            onSubmit={onCreate}
            onCancel={close}
            isLoading={isCreating}
          />
        )}
      </Modal>
      <Modal isOpen={modal.type === 'edit'} onClose={close} title="Edit Result">
        {modal.type === 'edit' && (
          <UpdateResultForm
            key={modal.item.id}
            defaultValues={{
              status: modal.item.status,
              notes: modal.item.notes ?? '',
              defectType: modal.item.defectType,
            }}
            onSubmit={onUpdate(modal.item.id)}
            onCancel={close}
            isLoading={isUpdating}
          />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={modal.type === 'delete'}
        onClose={close}
        onConfirm={() => deleteItem && onDelete(deleteItem.id)}
        title="Delete Result"
        description={
          deleteItem ? `Delete result for "${deleteItem.testCaseName}"?` : ''
        }
        isLoading={isDeleting}
      />
    </>
  );
};
