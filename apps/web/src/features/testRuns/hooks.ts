import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { CreateTestRun, TestRun, UpdateTestRun } from '@testcraft/types';

import { queryKeys } from '@/api/queryKeys';
import { importsApi } from '@/features/import/importsApi';
import { testRunQueries, testRunsApi } from '@/features/testRuns/api';
import { notify } from '@/lib/notify';

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

export const useTestRunSummaries = (
  runs: Pick<TestRun, 'id' | 'projectId'>[],
) =>
  useQueries({
    queries: runs.map((run) => testRunQueries.summary(run.projectId, run.id)),
    combine: (results) =>
      new Map(runs.map((run, index) => [run.id, results[index].data])),
  });

export const useProjectsTestRuns = (
  projectIds: string[],
  options?: {
    refetchInterval?: number;
    refetchIntervalInBackground?: boolean;
    staleTime?: number;
  },
) =>
  useQueries({
    queries: projectIds.map((projectId) => ({
      ...testRunQueries.all(projectId),
      ...options,
    })),
    combine: (results) => ({
      runs: results.flatMap((result) => result.data?.items ?? []),
      total: results.reduce(
        (sum, result) => sum + (result.data?.total ?? 0),
        0,
      ),
      isPending:
        results.length !== projectIds.length ||
        results.some((result) => result.isPending),
    }),
  });

export const useCreateTestRun = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestRun) => testRunsApi.create(projectId, input),
    onSuccess: () => {
      notify('Test run created');
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
    mutationFn: ({ id, ...input }: UpdateTestRun & { id: string }) =>
      testRunsApi.update(projectId, id, input),
    onSuccess: (_, { id }) => {
      notify('Test run updated');
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
      notify('Test run imported');
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
      notify('Test run deleted');
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
