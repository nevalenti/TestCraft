import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { queryKeys } from "@/api/queryKeys";
import { useSignalR } from "@/hooks/useSignalR";

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

  useSignalR(runId, {
    ResultAdded: invalidateResults,
    ResultUpdated: invalidateResults,
    ResultDeleted: invalidateResults,
    RunStatusChanged: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.detail(projectId, runId),
      });
    },
  });
};
