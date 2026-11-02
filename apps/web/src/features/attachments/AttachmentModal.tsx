import {
  ArrowDownTrayIcon,
  PaperClipIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import type { Attachment } from "@testcraft/types";
import { useRef, useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { SkeletonStatus } from "@/components/ui/skeleton/SkeletonStatus";
import { TablePager } from "@/components/ui/TablePager";
import {
  useAttachments,
  useDeleteAttachment,
  useDownloadAttachment,
  useUploadAttachment,
} from "@/features/attachments/hooks";
import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";
import { cn } from "@/lib/cn";
import { formatBytes, formatDateTime } from "@/lib/format";

const AttachmentRowSkeleton = () => (
  <li className="flex items-center gap-3 rounded-lg border border-border bg-base-100 px-3 py-2.5">
    <Skeleton className="size-4 shrink-0 rounded-sm" />
    <div className="min-w-0 flex-1">
      <Skeleton className="h-3.5 w-1/2" />
      <Skeleton className="mt-1.5 h-3 w-1/3" />
    </div>
  </li>
);

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  runId: string;
  resultId: string;
  testCaseName: string;
  readOnly?: boolean;
}

export const AttachmentModal = ({
  isOpen,
  onClose,
  projectId,
  runId,
  resultId,
  testCaseName,
  readOnly = false,
}: AttachmentModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(0);
  const { data: attachmentPage, isPending } = useAttachments(
    projectId,
    runId,
    resultId,
    page + 1,
  );
  const attachments = attachmentPage?.items;
  const upload = useUploadAttachment(projectId, runId, resultId);
  const del = useDeleteAttachment(projectId, runId, resultId);
  const { download } = useDownloadAttachment(projectId, runId, resultId);
  const showSkeleton = useIsLoadingVisible(isPending);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = "";
  };

  const handleDownload = (attachment: Attachment) => {
    download(attachment.id);
  };

  const handleDelete = (id: string) => {
    del.mutate(id, { onSuccess: () => setPage(0) });
  };

  const renderAttachments = () => {
    if (isPending)
      return (
        showSkeleton && (
          <SkeletonStatus label="Loading attachments…">
            <ul className="space-y-2">
              {Array.from({ length: 2 }, (_, i) => (
                <AttachmentRowSkeleton key={i} />
              ))}
            </ul>
          </SkeletonStatus>
        )
      );
    if (attachments?.length === 0)
      return (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <PaperClipIcon className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-secondary">No attachments yet</p>
        </div>
      );
    return (
      <ul className="space-y-2">
        {attachments?.map((attachment) => (
          <li
            key={attachment.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-base-100 px-3 py-2.5"
          >
            <PaperClipIcon className="size-4 shrink-0 text-fg-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {attachment.file_name}
              </p>
              <p className="text-xs text-fg-secondary">
                {formatBytes(attachment.size_bytes)} ·{" "}
                {formatDateTime(attachment.created_at)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                aria-label={`Download ${attachment.file_name}`}
                onClick={() => handleDownload(attachment)}
              >
                <ArrowDownTrayIcon className="size-3.5" />
              </button>
              {!readOnly && (
                <button
                  type="button"
                  className="btn text-fg-subtle btn-ghost btn-xs hover:bg-error/10 hover:text-error"
                  aria-label={`Delete ${attachment.file_name}`}
                  onClick={() => handleDelete(attachment.id)}
                  disabled={del.isPending}
                >
                  <TrashIcon className="size-3.5" />
                </button>
              )}
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
        <TablePager
          page={page}
          pageCount={
            attachmentPage
              ? Math.ceil(attachmentPage.total / attachmentPage.page_size)
              : 0
          }
          onPageChange={setPage}
        />

        <div
          className={cn(
            "flex items-center border-t border-border pt-3",
            readOnly ? "justify-end" : "justify-between",
          )}
        >
          {!readOnly && (
            <>
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
            </>
          )}
          <button type="button" className="btn btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
