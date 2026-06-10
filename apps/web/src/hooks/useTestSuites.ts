import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { CreateTestSuite, UpdateTestSuite } from "@testcraft/types";

import { queryKeys } from "@/api/queryKeys";
import { testSuiteQueries, testSuitesApi } from "@/api/testSuites";
import { notify } from "@/lib/notify";

export const useTestSuites = (projectId: string, search?: string) =>
  useQuery({
    ...testSuiteQueries.all(projectId, search),
    select: (data) => data.items,
    placeholderData: keepPreviousData,
  });

export const useTestSuite = (projectId: string, id: string) =>
  useQuery(testSuiteQueries.detail(projectId, id));

export const useCreateTestSuite = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestSuite) =>
      testSuitesApi.create(projectId, input),
    onSuccess: () => {
      notify("Suite created");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSuites.all(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
  });
};

export const useUpdateTestSuite = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateTestSuite) =>
      testSuitesApi.update(projectId, id, input),
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
  });
};
