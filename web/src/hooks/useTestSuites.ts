import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys";
import { testSuiteQueries, testSuitesApi } from "@/api/testSuites";
import { useNotificationsStore } from "@/stores/notifications";
import type { CreateTestSuiteDto, UpdateTestSuiteDto } from "@/types";

const notify = (message: string) =>
  useNotificationsStore
    .getState()
    .add({ type: "success", message, timeout: 3000 });

export const useTestSuites = (projectId: string) =>
  useQuery(testSuiteQueries.all(projectId));

export const useTestSuite = (projectId: string, id: string) =>
  useQuery(testSuiteQueries.detail(projectId, id));

export const useCreateTestSuite = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTestSuiteDto) =>
      testSuitesApi.create(projectId, dto),
    onSuccess: () => {
      notify("Suite created");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSuites.all(projectId),
      });
    },
  });
};

export const useUpdateTestSuite = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateTestSuiteDto) =>
      testSuitesApi.update(projectId, id, dto),
    onSuccess: (_, { id }) => {
      notify("Suite updated");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSuites.all(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSuites.detail(projectId, id),
      });
    },
  });
};

export const useDeleteTestSuite = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testSuitesApi.delete(projectId, id),
    onSuccess: (_, id) => {
      notify("Suite deleted");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSuites.all(projectId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.testSuites.detail(projectId, id),
      });
    },
  });
};
