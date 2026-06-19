import { queryOptions } from "@tanstack/react-query";
import type { Attachment } from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";

const BASE = (projectId: string, runId: string, resultId: string) =>
  `projects/${projectId}/runs/${runId}/results/${resultId}/attachments`;

export const attachmentsApi = {
  getAll: async (projectId: string, runId: string, resultId: string) => {
    const { data } = await client.get<Attachment[]>(
      BASE(projectId, runId, resultId),
    );
    return data;
  },
  upload: async (
    projectId: string,
    runId: string,
    resultId: string,
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await client.post<Attachment>(
      BASE(projectId, runId, resultId),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  },
  getDownloadUrl: async (
    projectId: string,
    runId: string,
    resultId: string,
    id: string,
  ) => {
    const { data } = await client.get<{ url: string }>(
      `${BASE(projectId, runId, resultId)}/${id}/download`,
    );
    return data.url;
  },
  delete: (projectId: string, runId: string, resultId: string, id: string) =>
    client.delete(`${BASE(projectId, runId, resultId)}/${id}`),
};

export const attachmentQueries = {
  all: (projectId: string, runId: string, resultId: string) =>
    queryOptions({
      queryKey: queryKeys.attachments.all(projectId, runId, resultId),
      queryFn: () => attachmentsApi.getAll(projectId, runId, resultId),
      enabled: !!projectId && !!runId && !!resultId,
    }),
};
