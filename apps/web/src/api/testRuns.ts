import { queryOptions } from "@tanstack/react-query";
import type {
  CreateTestRunInput,
  Paginated,
  TestRun,
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
      .then((r) => r.data),
  getById: (projectId: string, id: string) =>
    client.get<TestRun>(`${BASE(projectId)}/${id}`).then((r) => r.data),
  create: (projectId: string, dto: CreateTestRunInput) =>
    client.post<TestRun>(BASE(projectId), dto).then((r) => r.data),
  update: (projectId: string, id: string, dto: UpdateTestRunInput) =>
    client.put<TestRun>(`${BASE(projectId)}/${id}`, dto).then((r) => r.data),
  delete: (projectId: string, id: string) =>
    client.delete(`${BASE(projectId)}/${id}`),
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
};
