import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { queryKeys } from '@/api/queryKeys';
import { useSignalR } from '@/hooks/useSignalR';

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const useTestRunRealtime = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();

  const invalidateResults = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.testResults.all(projectId, runId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.testRuns.summary(projectId, runId),
    });
  }, [queryClient, projectId, runId]);

  const invalidateAll = useCallback(() => {
    invalidateResults();
    queryClient.invalidateQueries({
      queryKey: queryKeys.testRuns.detail(projectId, runId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.testRuns.logs(projectId, runId),
    });
  }, [invalidateResults, queryClient, projectId, runId]);

  useSignalR(
    runId,
    {
      ResultAdded: invalidateResults,
      ResultUpdated: invalidateResults,
      ResultDeleted: invalidateResults,
      RunStatusChanged: () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.testRuns.detail(projectId, runId),
        });
      },
      LogsAppended: (data) => {
        if (!isStringArray(data)) {
          console.error('LogsAppended: expected a string array, got', data);
          return;
        }

        queryClient.setQueryData<string[]>(
          queryKeys.testRuns.logs(projectId, runId),
          (previous = []) => [...previous, ...data],
        );
      },
    },
    invalidateAll,
  );
};
