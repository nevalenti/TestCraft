import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTestResultInput,
  UpdateTestResultInput,
} from "@testcraft/types";

import { queryKeys } from "@/api/queryKeys";
import { testResultQueries, testResultsApi } from "@/api/testResults";
import { useNotificationsStore } from "@/stores/notifications";

const notify = (message: string) =>
  useNotificationsStore
    .getState()
    .add({ type: "success", message, timeout: 6000 });

export const useTestResults = (projectId: string, runId: string) =>
  useQuery({
    ...testResultQueries.all(projectId, runId),
    select: (data) => data.items,
  });

export const useTestResult = (projectId: string, runId: string, id: string) =>
  useQuery(testResultQueries.detail(projectId, runId, id));

export const useCreateTestResult = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTestResultInput) =>
      testResultsApi.create(projectId, runId, input),
    onSuccess: () => {
      notify("Result saved");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testResults.all(projectId, runId),
      });
    },
  });
};

export const useUpdateTestResult = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateTestResultInput) =>
      testResultsApi.update(projectId, runId, id, input),
    onSuccess: (_, { id }) => {
      notify("Result updated");
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
      notify("Result deleted");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testResults.all(projectId, runId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.testResults.detail(projectId, runId, id),
      });
    },
  });
};
