import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { shareTokenQueries, shareTokensApi } from '@/api/shareTokens';
import { notify } from '@/lib/notify';

export const useShareTokens = (projectId: string, runId: string) =>
  useQuery(shareTokenQueries.all(projectId, runId));

export const useCreateShareToken = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { expiresAt?: string }) =>
      shareTokensApi.create(projectId, runId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareTokens.all(projectId, runId),
      });
    },
  });
};

export const useRevokeShareToken = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => shareTokensApi.revoke(projectId, runId, id),
    onSuccess: () => {
      notify('Share link revoked');
      queryClient.invalidateQueries({
        queryKey: queryKeys.shareTokens.all(projectId, runId),
      });
    },
  });
};

export const useSharedRun = (token: string) =>
  useQuery(shareTokenQueries.byToken(token));
