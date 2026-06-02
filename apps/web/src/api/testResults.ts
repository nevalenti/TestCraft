import { queryOptions } from "@tanstack/react-query";
import type {
  CreateTestResultInput,
  Paginated,
  TestResult,
  TestResultStatus,
  UpdateTestResultInput,
} from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { PAGE_SIZE } from "@/lib/constants";

const BASE = (projectId: string, runId: string) =>
  `projects/${projectId}/runs/${runId}/results`;

export const testResultsApi = {
  getAll: (projectId: string, runId: string, status?: TestResultStatus) =>
    client
      .get<Paginated<TestResult>>(BASE(projectId, runId), {
        params: {
          pageSize: PAGE_SIZE,
          ...(status !== undefined ? { status } : {}),
        },
      })
      .then((r) => r.data),
  getById: (projectId: string, runId: string, id: string) =>
    client
      .get<TestResult>(`${BASE(projectId, runId)}/${id}`)
      .then((r) => r.data),
  create: (projectId: string, runId: string, input: CreateTestResultInput) =>
    client.post<TestResult>(BASE(projectId, runId), input).then((r) => r.data),
  update: (
    projectId: string,
    runId: string,
    id: string,
    input: UpdateTestResultInput,
  ) =>
    client
      .put<TestResult>(`${BASE(projectId, runId)}/${id}`, input)
      .then((r) => r.data),
  delete: (projectId: string, runId: string, id: string) =>
    client.delete(`${BASE(projectId, runId)}/${id}`),
};

export const testResultQueries = {
  all: (projectId: string, runId: string, status?: TestResultStatus) =>
    queryOptions({
      queryKey: status
        ? ([...queryKeys.testResults.all(projectId, runId), status] as const)
        : queryKeys.testResults.all(projectId, runId),
      queryFn: () => testResultsApi.getAll(projectId, runId, status),
      enabled: !!projectId && !!runId,
    }),
  detail: (projectId: string, runId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testResults.detail(projectId, runId, id),
      queryFn: () => testResultsApi.getById(projectId, runId, id),
      enabled: !!projectId && !!runId && !!id,
    }),
};
