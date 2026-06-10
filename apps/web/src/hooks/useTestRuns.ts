import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { CreateTestRun, TestRun, UpdateTestRun } from "@testcraft/types";

import { importsApi } from "@/api/imports";
import { queryKeys } from "@/api/queryKeys";
import { testRunQueries, testRunsApi } from "@/api/testRuns";
import { notify } from "@/lib/notify";

export const useTestRuns = (projectId: string, search?: string) =>
  useQuery({
    ...testRunQueries.all(projectId, search),
    select: (data) => data.items,
    placeholderData: keepPreviousData,
  });

export const useTestRun = (projectId: string, id: string) =>
  useQuery(testRunQueries.detail(projectId, id));

export const useTestRunSummary = (projectId: string, id: string) =>
  useQuery(testRunQueries.summary(projectId, id));

export const useCreateTestRun = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestRun) => testRunsApi.create(projectId, input),
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
    mutationFn: ({ id, ...input }: { id: string } & UpdateTestRun) =>
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

const useImportMutation = <T>(
  projectId: string,
  mutationFn: (input: T) => Promise<TestRun>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      notify("Test run imported");
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.all(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
  });
};

export const useImportAllure = (projectId: string) =>
  useImportMutation(
    projectId,
    (input: Parameters<typeof importsApi.allure>[1]) =>
      importsApi.allure(projectId, input),
  );

export const useImportJUnitXml = (projectId: string) =>
  useImportMutation(
    projectId,
    (input: Parameters<typeof importsApi.junit>[1]) =>
      importsApi.junit(projectId, input),
  );

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
      queryClient.removeQueries({
        queryKey: queryKeys.testRuns.summary(projectId, id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
  });
};
