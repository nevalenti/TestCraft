import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys";
import { testResultQueries, testResultsApi } from "@/api/testResults";
import type { CreateTestResultDto, UpdateTestResultDto } from "@/types";

export const useTestResults = (projectId: string, runId: string) =>
  useQuery(testResultQueries.all(projectId, runId));

export const useTestResult = (projectId: string, runId: string, id: string) =>
  useQuery(testResultQueries.detail(projectId, runId, id));

export const useCreateTestResult = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTestResultDto) =>
      testResultsApi.create(projectId, runId, dto),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.testResults.all(projectId, runId),
      }),
  });
};

export const useUpdateTestResult = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateTestResultDto) =>
      testResultsApi.update(projectId, runId, id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testResults.all(projectId, runId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testResults.detail(projectId, runId, id),
      });
    },
  });
};

export const useDeleteTestResult = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testResultsApi.delete(projectId, runId, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testResults.all(projectId, runId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.testResults.detail(projectId, runId, id),
      });
    },
  });
};
