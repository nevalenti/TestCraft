import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiTokenResponse, CreateApiToken } from '@testcraft/types';

import { queryKeys } from '@/api/queryKeys';
import { apiTokenQueries, apiTokensApi } from '@/features/apiTokens/api';
import { notify } from '@/lib/notify';

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
    onSuccess: (_, id) => {
      const name = queryClient
        .getQueryData<ApiTokenResponse[]>(queryKeys.apiTokens.all(projectId))
        ?.find((token) => token.id === id)?.name;
      notify(name ? `Token "${name}" revoked` : 'Token revoked');
      queryClient.invalidateQueries({
        queryKey: queryKeys.apiTokens.all(projectId),
      });
    },
  });
};
