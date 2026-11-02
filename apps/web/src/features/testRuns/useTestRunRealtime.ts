import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { queryKeys } from "@/api/queryKeys";
import type { RunLogs } from "@/features/testRuns/api";
import { useTestRunSocket } from "@/features/testRuns/useTestRunSocket";
import { useThrottledCallback } from "@/hooks/useThrottledCallback";

const RESULTS_REFRESH_INTERVAL_MS = 1000;

interface LogsAppended {
  count: number;
  last_seq: number | null;
  lines: string[] | null;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isLogsAppended = (value: unknown): value is LogsAppended => {
  if (typeof value !== "object" || value === null) return false;
  const { count, last_seq: lastSeq, lines } = value as Partial<LogsAppended>;

  return (
    typeof count === "number" &&
    (lastSeq === null || typeof lastSeq === "number") &&
    (lines === null || isStringArray(lines))
  );
};

export const useTestRunRealtime = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();

  const invalidateResults = useThrottledCallback(() => {
    for (const queryKey of [
      queryKeys.testResults.all(projectId, runId),
      queryKeys.testRuns.summary(projectId, runId),
      queryKeys.analytics.all(projectId),
    ]) {
      queryClient.invalidateQueries({ queryKey }, { cancelRefetch: false });
    }
  }, RESULTS_REFRESH_INTERVAL_MS);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.testRuns.all(projectId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.analytics.all(projectId),
    });
  }, [queryClient, projectId]);

  useTestRunSocket(
    projectId,
    runId,
    {
      "result.added": invalidateResults,
      "result.updated": invalidateResults,
      "result.deleted": invalidateResults,
      "run.status_changed": invalidateAll,
      "logs.appended": (data) => {
        if (!isLogsAppended(data)) {
          console.error("logs.appended: unexpected payload", data);
          return;
        }
        const logsKey = queryKeys.testRuns.logs(projectId, runId);
        const previous = queryClient.getQueryData<RunLogs>(logsKey);
        const { lines, last_seq: lastSeq } = data;

        const canAppend =
          lines !== null &&
          lastSeq !== null &&
          previous !== undefined &&
          (previous.latestSeq === null || lastSeq > previous.latestSeq);
        if (!canAppend) {
          queryClient.invalidateQueries({ queryKey: logsKey });
          return;
        }

        queryClient.setQueryData<RunLogs>(logsKey, {
          ...previous,
          lines: [...previous.lines, ...lines],
          latestSeq: lastSeq,
        });
      },
    },
    invalidateAll,
  );
};
