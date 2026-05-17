import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { testSuiteQueries, testSuitesApi } from "@/api/testSuites";
import { queryKeys } from "@/api/queryKeys";
import type { CreateTestSuiteDto, UpdateTestSuiteDto } from "@/types";

export const useTestSuites = (projectId: string) =>
  useQuery(testSuiteQueries.all(projectId));

export const useTestSuite = (projectId: string, id: string) =>
  useQuery(testSuiteQueries.detail(projectId, id));

export const useCreateTestSuite = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTestSuiteDto) =>
      testSuitesApi.create(projectId, dto),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSuites.all(projectId),
      }),
  });
};

export const useUpdateTestSuite = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateTestSuiteDto) =>
      testSuitesApi.update(projectId, id, dto),
    onSuccess: (_, { id }) => {
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSuites.all(projectId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.testSuites.detail(projectId, id),
      });
    },
  });
};
