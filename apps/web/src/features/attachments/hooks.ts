import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Attachment } from '@testcraft/types';

import { queryKeys } from '@/api/queryKeys';
import { attachmentQueries, attachmentsApi } from '@/features/attachments/api';
import { notify } from '@/lib/notify';

export const useAttachments = (
  projectId: string,
  runId: string,
  resultId: string,
) => useQuery(attachmentQueries.all(projectId, runId, resultId));

export const useUploadAttachment = (
  projectId: string,
  runId: string,
  resultId: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) =>
      attachmentsApi.upload(projectId, runId, resultId, file),
    onSuccess: (_, file) => {
      notify(`Attachment "${file.name}" uploaded`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.attachments.all(projectId, runId, resultId),
      });
    },
  });
};

export const useDeleteAttachment = (
  projectId: string,
  runId: string,
  resultId: string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      attachmentsApi.delete(projectId, runId, resultId, id),
    onSuccess: (_, id) => {
      const fileName = queryClient
        .getQueryData<
          Attachment[]
        >(queryKeys.attachments.all(projectId, runId, resultId))
        ?.find((attachment) => attachment.id === id)?.fileName;
      notify(
        fileName ? `Attachment "${fileName}" deleted` : 'Attachment deleted',
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.attachments.all(projectId, runId, resultId),
      });
    },
  });
};

export const useDownloadAttachment = (
  projectId: string,
  runId: string,
  resultId: string,
) =>
  useMutation({
    mutationFn: (id: string) =>
      attachmentsApi.getDownloadUrl(projectId, runId, resultId, id),
    onSuccess: (url) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });
