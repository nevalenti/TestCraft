import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CreateTestRun,
  ImportJobResponse,
  TestRun,
  UpdateTestRun,
} from "@testcraft/types";
import { isAxiosError } from "axios";

import { queryKeys } from "@/api/queryKeys";
import {
  type RunLogs,
  testRunQueries,
  testRunsApi,
} from "@/features/testRuns/api";
import { importsApi } from "@/features/testRuns/resultImport/api";
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

export const useTestRunSummaries = (
  runs: Pick<TestRun, "id" | "project_id">[],
) =>
  useQueries({
    queries: runs.map((run) => testRunQueries.summary(run.project_id, run.id)),
    combine: (results) =>
      new Map(runs.map((run, index) => [run.id, results[index].data])),
  });

export const useCreateTestRun = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTestRun) => testRunsApi.create(projectId, input),
    onSuccess: (_, input) => {
      notify(`Test run "${input.name}" created`);
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
    mutationFn: ({
      id,
      version,
      ...input
    }: UpdateTestRun & {
      id: string;
      version: number;
    }) => testRunsApi.update(projectId, id, input, version),
    onSuccess: (_, { name }) => {
      notify(`Test run "${name}" updated`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.all(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.all(projectId),
      });
    },
  });
};

const IMPORT_POLL_INTERVAL_MS = 1500;
const IMPORT_POLL_MAX_ATTEMPTS = 20;

const pollImportJob = async (
  projectId: string,
  job: ImportJobResponse,
): Promise<ImportJobResponse> => {
  let current = job;
  for (let attempt = 0; attempt < IMPORT_POLL_MAX_ATTEMPTS; attempt++) {
    if (current.status === "completed") return current;
    if (current.status === "failed")
      throw new Error(current.error ?? "Test run import failed");
    await new Promise((resolve) =>
      setTimeout(resolve, IMPORT_POLL_INTERVAL_MS),
    );
    try {
      current = await importsApi.getJob(projectId, current.id);
    } catch {
      throw new Error(
        "Could not check the import status. Refresh the runs list in a moment.",
      );
    }
  }
  throw new Error("Test run import timed out");
};

const useImportMutation = <T>(
  projectId: string,
  format: string,
  mutationFn: (input: T) => Promise<ImportJobResponse>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: T) => {
      const job = await mutationFn(input);
      return pollImportJob(projectId, job);
    },
    onSuccess: () => {
      notify(`${format} results imported`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.testRuns.all(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
    onError: (error: Error) => {
      if (isAxiosError(error)) return;
      notify(error.message || `${format} import failed`, "error");
    },
  });
};

export const useImportAllure = (projectId: string) =>
  useImportMutation(
    projectId,
    "Allure",
    (input: Parameters<typeof importsApi.allure>[1]) =>
      importsApi.allure(projectId, input),
  );

export const useImportJUnitXml = (projectId: string) =>
  useImportMutation(
    projectId,
    "JUnit",
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
  });
};

const NO_LOG_LINES: string[] = [];

export const useRunLogs = (projectId: string, runId: string) => {
  const queryClient = useQueryClient();
  const { data } = useQuery(testRunQueries.logs(projectId, runId));
  const earliestSeq = data?.earliestSeq ?? null;

  const { mutate, isPending } = useMutation({
    mutationFn: (beforeSeq: number) =>
      testRunsApi.getLogs(projectId, runId, beforeSeq),
    meta: { silentErrors: true },
    onSuccess: (earlier, beforeSeq) => {
      queryClient.setQueryData<RunLogs>(
        queryKeys.testRuns.logs(projectId, runId),
        (previous) =>
          previous?.earliestSeq === beforeSeq
            ? {
                ...previous,
                lines: [...earlier.lines, ...previous.lines],
                earliestSeq: earlier.earliestSeq ?? beforeSeq,
                hasMore: earlier.hasMore,
              }
            : previous,
      );
    },
    onError: () => notify("Could not load earlier log lines", "error"),
  });

  return {
    lines: data?.lines ?? NO_LOG_LINES,
    earliestSeq,
    hasMore: data?.hasMore ?? false,
    isLoadingEarlier: isPending,
    loadEarlier: () => {
      if (earliestSeq !== null) mutate(earliestSeq);
    },
  };
};
