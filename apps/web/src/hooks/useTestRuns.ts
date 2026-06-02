import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTestRunInput, UpdateTestRunInput } from "@testcraft/types";

import { queryKeys } from "@/api/queryKeys";
import { testRunQueries, testRunsApi } from "@/api/testRuns";
import { notify } from "@/lib/notify";

export const useTestRuns = (projectId: string) =>
  useQuery({
    ...testRunQueries.all(projectId),
    select: (data) => data.items,
  });

export const useTestRun = (projectId: string, id: string) =>
  useQuery(testRunQueries.detail(projectId, id));

export const useTestRunSummary = (projectId: string, id: string) =>
  useQuery(testRunQueries.summary(projectId, id));

export const useCreateTestRun = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTestRunInput) =>
      testRunsApi.create(projectId, input),
    onSuccess: () => {
      notify("Test run created");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.all(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
  });
};

export const useUpdateTestRun = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateTestRunInput) =>
      testRunsApi.update(projectId, id, input),
    onSuccess: (_, { id }) => {
      notify("Test run updated");
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
      notify("Test run deleted");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.all(projectId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.testRuns.detail(projectId, id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
  });
};
