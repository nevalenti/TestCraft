import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { queryKeys } from '@/api/queryKeys';
import { testResultsApi } from '@/api/testResults';
import { testRunsApi } from '@/api/testRuns';

export const useResultFeed = (projectId: string, runId: string) => {
  const feedKey = useMemo(
    () => [...queryKeys.testResults.all(projectId, runId), 'feed'],
    [projectId, runId],
  );

  const { data: page, isLoading } = useQuery({
    queryKey: feedKey,
    queryFn: () =>
      testResultsApi.getAll(projectId, runId, undefined, undefined, 1, 500),
    refetchOnWindowFocus: false,
  });

  const { data: logs = [] } = useQuery({
    queryKey: queryKeys.testRuns.logs(projectId, runId),
    queryFn: () => testRunsApi.getLogs(projectId, runId),
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const items = useMemo(() => (page?.items ?? []).toReversed(), [page]);

  return { items, logs, isLoading };
};
