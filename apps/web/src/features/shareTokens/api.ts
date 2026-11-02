import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";
import { TABLE_PAGE_SIZE } from "@/lib/constants";

export const shareTokensApi = {
  getAll: async (projectId: string, runId: string) => {
    const { data } = await sdk.listShareTokens({
      path: { project_id: projectId, run_id: runId },
    });
    return data;
  },
  create: async (
    projectId: string,
    runId: string,
    input: { expires_at?: string },
  ) => {
    const { data } = await sdk.createShareToken({
      path: { project_id: projectId, run_id: runId },
      body: input,
    });
    return data;
  },
  revoke: (projectId: string, runId: string, id: string) =>
    sdk.revokeShareToken({
      path: { project_id: projectId, run_id: runId, token_id: id },
    }),
  getByToken: async (token: string, page: number = 0) => {
    const { data } = await sdk.getRunByShareToken({
      path: { token: token },
      query: { page: page + 1, page_size: TABLE_PAGE_SIZE },
    });
    return data;
  },
};

export const shareTokenQueries = {
  all: (projectId: string, runId: string) =>
    queryOptions({
      queryKey: queryKeys.shareTokens.all(projectId, runId),
      queryFn: () => shareTokensApi.getAll(projectId, runId),
      enabled: !!projectId && !!runId,
    }),
  byToken: (token: string, page: number = 0) =>
    queryOptions({
      queryKey: queryKeys.shareTokens.byToken(token, page),
      queryFn: () => shareTokensApi.getByToken(token, page),
      enabled: !!token,
      retry: false,
      placeholderData: keepPreviousData,
    }),
};
