import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateApiToken } from "@testcraft/types";

import { apiTokenQueries, apiTokensApi } from "@/api/apiTokens";
import { queryKeys } from "@/api/queryKeys";
import { notify } from "@/lib/notify";

export const useApiTokens = (projectId: string) =>
  useQuery(apiTokenQueries.all(projectId));

export const useCreateApiToken = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateApiToken) =>
      apiTokensApi.create(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.apiTokens.all(projectId),
      });
    },
  });
};

export const useRevokeApiToken = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiTokensApi.revoke(projectId, id),
    onSuccess: () => {
      notify("Token revoked");
      queryClient.invalidateQueries({
        queryKey: queryKeys.apiTokens.all(projectId),
      });
    },
  });
};
