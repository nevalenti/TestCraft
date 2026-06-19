import { queryOptions } from "@tanstack/react-query";
import type { SharedRunResponse, ShareToken } from "@testcraft/types";
import axios from "axios";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { env } from "@/lib/env";

const BASE = (projectId: string, runId: string) =>
  `projects/${projectId}/runs/${runId}/share`;

export const shareTokensApi = {
  getAll: async (projectId: string, runId: string) => {
    const { data } = await client.get<ShareToken[]>(BASE(projectId, runId));
    return data;
  },
  create: async (
    projectId: string,
    runId: string,
    input: { expiresAt?: string },
  ) => {
    const { data } = await client.post<ShareToken>(
      BASE(projectId, runId),
      input,
    );
    return data;
  },
  revoke: (projectId: string, runId: string, id: string) =>
    client.delete(`${BASE(projectId, runId)}/${id}`),
  getByToken: async (token: string) => {
    const { data } = await axios.get<SharedRunResponse>(
      `${env.VITE_API_URL}/share/${token}`,
    );
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
  byToken: (token: string) =>
    queryOptions({
      queryKey: queryKeys.shareTokens.byToken(token),
      queryFn: () => shareTokensApi.getByToken(token),
      enabled: !!token,
      retry: false,
    }),
};
