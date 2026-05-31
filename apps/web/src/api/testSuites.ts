import { queryOptions } from "@tanstack/react-query";
import type {
  CreateTestSuiteInput,
  Paginated,
  TestSuite,
  UpdateTestSuiteInput,
} from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { PAGE_SIZE } from "@/lib/constants";

const BASE = (projectId: string) => `projects/${projectId}/suites`;

export const testSuitesApi = {
  getAll: (projectId: string) =>
    client
      .get<Paginated<TestSuite>>(BASE(projectId), {
        params: { pageSize: PAGE_SIZE },
      })
      .then((r) => r.data),
  getById: (projectId: string, id: string) =>
    client.get<TestSuite>(`${BASE(projectId)}/${id}`).then((r) => r.data),
  create: (projectId: string, dto: CreateTestSuiteInput) =>
    client.post<TestSuite>(BASE(projectId), dto).then((r) => r.data),
  update: (projectId: string, id: string, dto: UpdateTestSuiteInput) =>
    client.put<TestSuite>(`${BASE(projectId)}/${id}`, dto).then((r) => r.data),
  delete: (projectId: string, id: string) =>
    client.delete(`${BASE(projectId)}/${id}`),
};

export const testSuiteQueries = {
  all: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.testSuites.all(projectId),
      queryFn: () => testSuitesApi.getAll(projectId),
      enabled: !!projectId,
    }),
  detail: (projectId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testSuites.detail(projectId, id),
      queryFn: () => testSuitesApi.getById(projectId, id),
      enabled: !!projectId && !!id,
    }),
};
