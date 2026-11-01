import { queryOptions } from "@tanstack/react-query";
import type { CreateApiToken } from "@testcraft/types";

import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";

export const apiTokensApi = {
  getAll: async (projectId: string) => {
    const { data } = await sdk.listApiTokens({
      path: { project_id: projectId },
    });
    return data;
  },
  create: async (projectId: string, input: CreateApiToken) => {
    const { data } = await sdk.createApiToken({
      path: { project_id: projectId },
      body: input,
    });
    return data;
  },
  revoke: (projectId: string, id: string) =>
    sdk.revokeApiToken({
      path: { project_id: projectId, token_id: id },
    }),
};

export const apiTokenQueries = {
  all: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.apiTokens.all(projectId),
      queryFn: () => apiTokensApi.getAll(projectId),
      enabled: !!projectId,
    }),
};
