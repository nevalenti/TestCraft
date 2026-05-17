import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys";
import { testRunQueries, testRunsApi } from "@/api/testRuns";
import type { CreateTestRunDto, UpdateTestRunDto } from "@/types";

export const useTestRuns = (projectId: string) =>
  useQuery(testRunQueries.all(projectId));

export const useTestRun = (projectId: string, id: string) =>
  useQuery(testRunQueries.detail(projectId, id));

export const useCreateTestRun = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTestRunDto) => testRunsApi.create(projectId, dto),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.all(projectId),
      }),
  });
};

export const useUpdateTestRun = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateTestRunDto) =>
      testRunsApi.update(projectId, id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.all(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.detail(projectId, id),
      });
    },
  });
};

export const useDeleteTestRun = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testRunsApi.delete(projectId, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.all(projectId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.testRuns.detail(projectId, id),
      });
    },
  });
};
