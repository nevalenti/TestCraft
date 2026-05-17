import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys";
import { testCaseQueries, testCasesApi } from "@/api/testCases";
import type { CreateTestCaseDto, UpdateTestCaseDto } from "@/types";

export const useTestCases = (projectId: string, suiteId: string) =>
  useQuery(testCaseQueries.all(projectId, suiteId));

export const useTestCase = (projectId: string, suiteId: string, id: string) =>
  useQuery(testCaseQueries.detail(projectId, suiteId, id));

export const useCreateTestCase = (projectId: string, suiteId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTestCaseDto) =>
      testCasesApi.create(projectId, suiteId, dto),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.all(projectId, suiteId),
      }),
  });
};

export const useUpdateTestCase = (projectId: string, suiteId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & UpdateTestCaseDto) =>
      testCasesApi.update(projectId, suiteId, id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.all(projectId, suiteId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.detail(projectId, suiteId, id),
      });
    },
  });
};

export const useDeleteTestCase = (projectId: string, suiteId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testCasesApi.delete(projectId, suiteId, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testCases.all(projectId, suiteId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.testCases.detail(projectId, suiteId, id),
      });
    },
  });
};
