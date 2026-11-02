import { queryOptions } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";

export const attachmentsApi = {
  getPage: async (
    projectId: string,
    runId: string,
    resultId: string,
    page: number,
  ) => {
    const { data } = await sdk.listAttachments({
      path: { project_id: projectId, run_id: runId, result_id: resultId },
      query: { page, page_size: 20 },
    });
    return data;
  },
  upload: async (
    projectId: string,
    runId: string,
    resultId: string,
    file: File,
  ) => {
    const { data } = await sdk.uploadAttachment({
      path: { project_id: projectId, run_id: runId, result_id: resultId },
      body: { file },
    });
    return data;
  },
  getDownloadUrl: async (
    projectId: string,
    runId: string,
    resultId: string,
    id: string,
  ) => {
    const { data } = await sdk.getAttachmentDownloadUrl({
      path: {
        project_id: projectId,
        run_id: runId,
        result_id: resultId,
        attachment_id: id,
      },
    });
    return data.url;
  },
  delete: (projectId: string, runId: string, resultId: string, id: string) =>
    sdk.deleteAttachment({
      path: {
        project_id: projectId,
        run_id: runId,
        result_id: resultId,
        attachment_id: id,
      },
    }),
};

export const attachmentQueries = {
  page: (projectId: string, runId: string, resultId: string, page: number) =>
    queryOptions({
      queryKey: queryKeys.attachments.page(projectId, runId, resultId, page),
      queryFn: () => attachmentsApi.getPage(projectId, runId, resultId, page),
      enabled: !!projectId && !!runId && !!resultId,
    }),
};
