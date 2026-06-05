import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type {
  CreateTestResult,
  Paginated,
  TestResult,
  TestResultStatus,
  UpdateTestResult,
} from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { PAGE_SIZE } from "@/lib/constants";

const BASE = (projectId: string, runId: string) =>
  `projects/${projectId}/runs/${runId}/results`;

export const testResultsApi = {
  getAll: (
    projectId: string,
    runId: string,
    status?: TestResultStatus,
    search?: string,
  ) =>
    client
      .get<Paginated<TestResult>>(BASE(projectId, runId), {
        params: {
          pageSize: PAGE_SIZE,
          ...(status !== undefined ? { status } : {}),
          ...(search ? { search } : {}),
        },
      })
      .then((response) => response.data),
  getById: (projectId: string, runId: string, id: string) =>
    client
      .get<TestResult>(`${BASE(projectId, runId)}/${id}`)
      .then((response) => response.data),
  create: (projectId: string, runId: string, input: CreateTestResult) =>
    client
      .post<TestResult>(BASE(projectId, runId), input)
      .then((response) => response.data),
  update: (
    projectId: string,
    runId: string,
    id: string,
    input: UpdateTestResult,
  ) =>
    client
      .put<TestResult>(`${BASE(projectId, runId)}/${id}`, input)
      .then((response) => response.data),
  delete: (projectId: string, runId: string, id: string) =>
    client.delete(`${BASE(projectId, runId)}/${id}`),
};

export const testResultQueries = {
  all: (
    projectId: string,
    runId: string,
    status?: TestResultStatus,
    search?: string,
  ) =>
    queryOptions({
      queryKey: [
        ...queryKeys.testResults.all(projectId, runId),
        status,
        search,
      ],
      queryFn: () => testResultsApi.getAll(projectId, runId, status, search),
      enabled: !!projectId && !!runId,
      placeholderData: keepPreviousData,
    }),
  detail: (projectId: string, runId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testResults.detail(projectId, runId, id),
      queryFn: () => testResultsApi.getById(projectId, runId, id),
      enabled: !!projectId && !!runId && !!id,
    }),
};
