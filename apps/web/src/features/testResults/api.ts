import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type {
  CreateTestResult,
  TestResultStatus,
  UpdateTestResult,
} from "@testcraft/types";

import { fetchAllPages } from "@/api/fetchAllPages";
import { ifMatch } from "@/api/ifMatch";
import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";

export const RESULTS_PAGE_SIZE = 15;
export type ResultSortKey =
  | "test_case_name"
  | "status"
  | "duration_ms"
  | "executed_at";
export type ResultSortDirection = "asc" | "desc";

export const testResultsApi = {
  getAll: async (
    projectId: string,
    runId: string,
    status?: TestResultStatus,
    search?: string,
    page = 1,
    pageSize = RESULTS_PAGE_SIZE,
    sortBy?: ResultSortKey,
    sortDir?: ResultSortDirection,
  ) => {
    const { data } = await sdk.listTestResults({
      path: { project_id: projectId, run_id: runId },
      query: {
        page,
        page_size: pageSize,
        ...(status !== undefined && { status }),
        ...(search && { search }),
        ...(sortBy && { sort_by: sortBy, sort_dir: sortDir }),
      },
    });
    return data;
  },
  create: async (projectId: string, runId: string, input: CreateTestResult) => {
    const { data } = await sdk.createTestResult({
      path: { project_id: projectId, run_id: runId },
      body: input,
    });
    return data;
  },
  update: async (
    projectId: string,
    runId: string,
    id: string,
    input: UpdateTestResult,
    version: number,
  ) => {
    const { data } = await sdk.updateTestResult({
      path: { project_id: projectId, run_id: runId, result_id: id },
      body: input,
      headers: ifMatch(version),
    });
    return data;
  },
  delete: (projectId: string, runId: string, id: string) =>
    sdk.deleteTestResult({
      path: { project_id: projectId, run_id: runId, result_id: id },
    }),
};

export const testResultQueries = {
  all: (
    projectId: string,
    runId: string,
    status?: TestResultStatus,
    search?: string,
    page = 1,
    sortBy?: ResultSortKey,
    sortDir?: ResultSortDirection,
  ) =>
    queryOptions({
      queryKey: [
        ...queryKeys.testResults.all(projectId, runId),
        status,
        search,
        page,
        sortBy,
        sortDir,
      ],
      queryFn: () =>
        testResultsApi.getAll(
          projectId,
          runId,
          status,
          search,
          page,
          RESULTS_PAGE_SIZE,
          sortBy,
          sortDir,
        ),
      enabled: !!projectId && !!runId,
      placeholderData: keepPreviousData,
    }),
  everything: (
    projectId: string,
    runId: string,
    status?: TestResultStatus,
    search?: string,
  ) =>
    queryOptions({
      queryKey: [
        ...queryKeys.testResults.all(projectId, runId),
        "everything",
        status,
        search,
      ],
      queryFn: () =>
        fetchAllPages((page) =>
          testResultsApi.getAll(projectId, runId, status, search, page, 500),
        ),
      enabled: !!projectId && !!runId,
      placeholderData: keepPreviousData,
    }),
  feed: (projectId: string, runId: string) =>
    queryOptions({
      queryKey: [...queryKeys.testResults.all(projectId, runId), "feed"],
      queryFn: () =>
        fetchAllPages((page) =>
          testResultsApi.getAll(
            projectId,
            runId,
            undefined,
            undefined,
            page,
            500,
          ),
        ),
      enabled: !!projectId && !!runId,
      refetchOnWindowFocus: false,
    }),
};
