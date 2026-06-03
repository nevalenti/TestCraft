import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AllureResultItem,
  CreateTestRunInput,
  TestRun,
  UpdateTestRunInput,
} from "@testcraft/types";

import { importsApi } from "@/api/imports";
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
    onError: () =>
      notify("Import failed — check the file and try again", "error"),
  });
};

export const useImportAllure = (projectId: string) =>
  useImportMutation(
    projectId,
    (input: {
      results: AllureResultItem[];
      environment: string;
      name?: string;
    }) => importsApi.allure(projectId, input),
  );

export const useImportJunitXml = (projectId: string) =>
  useImportMutation(
    projectId,
    (input: { xml: string; environment: string; name?: string }) =>
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
  });
};
