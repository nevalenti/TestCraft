import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TestRunStatus } from "@testcraft/types";
import { useMemo } from "react";

import { testResultsApi } from "@/api/testResults";
import { testRunsApi } from "@/api/testRuns";
import { useSignalR } from "@/hooks/useSignalR";
import { useTestRun } from "@/hooks/useTestRuns";

export const useResultFeed = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();
  const { data: run } = useTestRun(projectId, runId);
  const isActive = run?.status === TestRunStatus.Active;

  const feedKey = useMemo(() => ["feed", projectId, runId], [projectId, runId]);
  const logsKey = useMemo(
    () => ["run-logs", projectId, runId],
    [projectId, runId],
  );

  const { data: page, isLoading } = useQuery({
    queryKey: feedKey,
    queryFn: () =>
      testResultsApi.getAll(projectId, runId, undefined, undefined, 1, 500),
    refetchOnWindowFocus: false,
    refetchInterval: isActive ? 3000 : false,
  });

  const { data: logs = [] } = useQuery({
    queryKey: logsKey,
    queryFn: () => testRunsApi.getLogs(projectId, runId),
    refetchOnWindowFocus: false,
    refetchInterval: isActive ? 2000 : false,
  });

  const items = useMemo(() => (page?.items ?? []).toReversed(), [page]);

  const invalidateFeed = async () => {
    await queryClient.invalidateQueries({ queryKey: feedKey });
  };

  useSignalR(runId, {
    ResultAdded: invalidateFeed,
    ResultUpdated: invalidateFeed,
    ResultDeleted: invalidateFeed,
    RunStatusChanged: invalidateFeed,
    LogsAppended: (data) => {
      queryClient.setQueryData<string[]>(logsKey, (prev = []) => [
        ...prev,
        ...(data as string[]),
      ]);
    },
  });

  return { items, logs, isLoading };
};
