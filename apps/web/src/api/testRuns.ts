import { queryOptions } from "@tanstack/react-query";
import type {
  CreateTestRunInput,
  Paginated,
  TestRun,
  TestRunSummary,
  UpdateTestRunInput,
} from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { PAGE_SIZE } from "@/lib/constants";

const BASE = (projectId: string) => `projects/${projectId}/runs`;

export const testRunsApi = {
  getAll: (projectId: string) =>
    client
      .get<Paginated<TestRun>>(BASE(projectId), {
        params: { pageSize: PAGE_SIZE },
      })
      .then((response) => response.data),
  getById: (projectId: string, id: string) =>
    client
      .get<TestRun>(`${BASE(projectId)}/${id}`)
      .then((response) => response.data),
  create: (projectId: string, input: CreateTestRunInput) =>
    client
      .post<TestRun>(BASE(projectId), input)
      .then((response) => response.data),
  update: (projectId: string, id: string, input: UpdateTestRunInput) =>
    client
      .put<TestRun>(`${BASE(projectId)}/${id}`, input)
      .then((response) => response.data),
  delete: (projectId: string, id: string) =>
    client.delete(`${BASE(projectId)}/${id}`),
  getSummary: (projectId: string, id: string) =>
    client
      .get<TestRunSummary>(`${BASE(projectId)}/${id}/summary`)
      .then((response) => response.data),
};

export const testRunQueries = {
  all: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.testRuns.all(projectId),
      queryFn: () => testRunsApi.getAll(projectId),
      enabled: !!projectId,
    }),
  detail: (projectId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testRuns.detail(projectId, id),
      queryFn: () => testRunsApi.getById(projectId, id),
      enabled: !!projectId && !!id,
    }),
  summary: (projectId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testRuns.summary(projectId, id),
      queryFn: () => testRunsApi.getSummary(projectId, id),
      enabled: !!projectId && !!id,
    }),
};
