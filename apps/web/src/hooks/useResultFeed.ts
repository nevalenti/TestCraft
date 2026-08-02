import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { testResultQueries } from '@/api/testResults';
import { testRunQueries } from '@/api/testRuns';

export const useResultFeed = (projectId: string, runId: string) => {
  const { data: page, isLoading } = useQuery(
    testResultQueries.feed(projectId, runId),
  );

  const { data: logs = [] } = useQuery(testRunQueries.logs(projectId, runId));

  const items = useMemo(() => (page?.items ?? []).toReversed(), [page]);

  return { items, logs, isLoading };
};
