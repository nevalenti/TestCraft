import {
  ArrowDownTrayIcon,
  PaperClipIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/solid';
import type { Attachment } from '@testcraft/types';
import { useRef } from 'react';

import { attachmentsApi } from '@/api/attachments';
import { Modal } from '@/components/ui/Modal';
import {
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from '@/hooks/useAttachments';
import { formatDateTime } from '@/lib/format';

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  runId: string;
  resultId: string;
  testCaseName: string;
}

export const AttachmentModal = ({
  isOpen,
  onClose,
  projectId,
  runId,
  resultId,
  testCaseName,
}: AttachmentModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: attachments, isPending } = useAttachments(
    projectId,
    runId,
    resultId,
  );
  const upload = useUploadAttachment(projectId, runId, resultId);
  const del = useDeleteAttachment(projectId, runId, resultId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = '';
  };

  const handleDownload = async (attachment: Attachment) => {
    const url = await attachmentsApi.getDownloadUrl(
      projectId,
      runId,
      resultId,
      attachment.id,
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderAttachments = () => {
    if (isPending)
      return (
        <div className="flex justify-center py-8">
          <span className="loading loading-md loading-spinner text-primary" />
        </div>
      );
    if (attachments?.length === 0)
      return (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <PaperClipIcon className="size-8 text-base-content/35" />
          <p className="text-sm text-base-content/75">No attachments yet</p>
        </div>
      );
    return (
      <ul className="space-y-2">
        {attachments?.map((attachment) => (
          <li
            key={attachment.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-base-100 px-3 py-2.5"
          >
            <PaperClipIcon className="size-4 shrink-0 text-base-content/65" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {attachment.fileName}
              </p>
              <p className="text-xs text-base-content/75">
                {formatBytes(attachment.sizeBytes)} ·{' '}
                {formatDateTime(attachment.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                aria-label={`Download ${attachment.fileName}`}
                onClick={() => handleDownload(attachment)}
              >
                <ArrowDownTrayIcon className="size-3.5" />
              </button>
              <button
                type="button"
                className="btn text-error btn-ghost btn-xs hover:bg-error/10"
                aria-label={`Delete ${attachment.fileName}`}
                onClick={() => del.mutate(attachment.id)}
                disabled={del.isPending}
              >
                <TrashIcon className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Attachments — ${testCaseName}`}
    >
      <div className="space-y-4">
        {renderAttachments()}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={upload.isPending}
          >
            {upload.isPending ? (
              <span className="loading loading-xs loading-spinner" />
            ) : (
              <PlusIcon className="size-4" />
            )}
            Upload file
          </button>
          <button type="button" className="btn btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
