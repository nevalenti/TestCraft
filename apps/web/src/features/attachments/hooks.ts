import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Attachment, Paginated } from "@testcraft/types";

import { queryKeys } from "@/api/queryKeys";
import { attachmentQueries, attachmentsApi } from "@/features/attachments/api";
import { notify } from "@/lib/notify";

export const useAttachments = (
  projectId: string,
  runId: string,
  resultId: string,
  page = 1,
) => useQuery(attachmentQueries.page(projectId, runId, resultId, page));

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
        .getQueriesData<Paginated<Attachment>>({
          queryKey: queryKeys.attachments.all(projectId, runId, resultId),
        })
        .flatMap(([, page]) => page?.items ?? [])
        .find((attachment: Attachment) => attachment.id === id)?.file_name;
      notify(
        fileName ? `Attachment "${fileName}" deleted` : "Attachment deleted",
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
) => {
  const { mutate, ...mutation } = useMutation({
    mutationFn: ({ id }: { id: string; target: Window | null }) =>
      attachmentsApi.getDownloadUrl(projectId, runId, resultId, id),
    meta: { silentErrors: true },
    onSuccess: (url, { target }) => {
      if (target) target.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    },
    onError: (_error, { target }) => {
      target?.close();
      notify("Could not download attachment", "error");
    },
  });

  const download = (id: string) => {
    const target = window.open("", "_blank");
    if (target) target.opener = null;
    mutate({ id, target });
  };

  return { ...mutation, download };
};
