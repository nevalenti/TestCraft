import { queryOptions } from "@tanstack/react-query";
import type {
  ApiTokenResponse,
  CreateApiToken,
  CreateApiTokenResponse,
} from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";

const BASE = (projectId: string) => `projects/${projectId}/tokens`;

export const apiTokensApi = {
  getAll: async (projectId: string) => {
    const { data } = await client.get<ApiTokenResponse[]>(BASE(projectId));
    return data;
  },
  create: async (projectId: string, input: CreateApiToken) => {
    const { data } = await client.post<CreateApiTokenResponse>(
      BASE(projectId),
      input,
    );
    return data;
  },
  revoke: (projectId: string, id: string) =>
    client.delete(`${BASE(projectId)}/${id}`),
};

export const apiTokenQueries = {
  all: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.apiTokens.all(projectId),
      queryFn: () => apiTokensApi.getAll(projectId),
      enabled: !!projectId,
    }),
};
