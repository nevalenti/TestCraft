import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTestResult,
  TestResultStatus,
  UpdateTestResult,
} from "@testcraft/types";

import { queryKeys } from "@/api/queryKeys";
import {
  type ResultSortDirection,
  type ResultSortKey,
  testResultQueries,
  testResultsApi,
} from "@/features/testResults/api";
import { statusLabel } from "@/features/testResults/resultStatus";
import { notify } from "@/lib/notify";

export const useTestResults = (
  projectId: string,
  runId: string,
  status?: TestResultStatus,
  search?: string,
  page = 1,
  sortBy?: ResultSortKey,
  sortDir?: ResultSortDirection,
) =>
  useQuery(
    testResultQueries.all(
      projectId,
      runId,
      status,
      search,
      page,
      sortBy,
      sortDir,
    ),
  );

export const useAllTestResults = (
  projectId: string,
  runId: string,
  status?: TestResultStatus,
  search?: string,
  isEnabled = true,
) =>
  useQuery({
    ...testResultQueries.everything(projectId, runId, status, search),
    enabled: isEnabled && !!projectId && !!runId,
    select: (data) => data.items,
  });

export const useCreateTestResult = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestResult) =>
      testResultsApi.create(projectId, runId, input),
    onSuccess: (data) => {
      notify(
        `Result saved for "${data.test_case_name}": ${statusLabel(data.status)}`,
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.testResults.all(projectId, runId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.summary(projectId, runId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.all(projectId),
      });
    },
  });
};

export const useUpdateTestResult = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      version,
      ...input
    }: UpdateTestResult & {
      id: string;
      version: number;
    }) => testResultsApi.update(projectId, runId, id, input, version),
    onSuccess: (data) => {
      notify(
        `Result for "${data.test_case_name}" updated to ${statusLabel(data.status)}`,
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.testResults.all(projectId, runId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.summary(projectId, runId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.all(projectId),
      });
    },
  });
};

export const useDeleteTestResult = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => testResultsApi.delete(projectId, runId, id),
    onSuccess: () => {
      notify("Result deleted");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testResults.all(projectId, runId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.summary(projectId, runId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.all(projectId),
      });
    },
  });
};
