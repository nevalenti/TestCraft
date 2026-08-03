import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { attachmentQueries, attachmentsApi } from '@/api/attachments';
import { queryKeys } from '@/api/queryKeys';
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
    onSuccess: () => {
      notify('Attachment uploaded');
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
    onSuccess: () => {
      notify('Attachment deleted');
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
