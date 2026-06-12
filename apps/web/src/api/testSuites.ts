import { queryOptions } from "@tanstack/react-query";
import type {
  CreateTestSuite,
  Paginated,
  TestSuite,
  UpdateTestSuite,
} from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { PAGE_SIZE } from "@/lib/constants";

const BASE = (projectId: string) => `projects/${projectId}/suites`;

export const testSuitesApi = {
  getAll: (projectId: string, search?: string) =>
    client
      .get<Paginated<TestSuite>>(BASE(projectId), {
        params: { pageSize: PAGE_SIZE, ...(search ? { search } : {}) },
      })
      .then((response) => response.data),
  getById: (projectId: string, id: string) =>
    client
      .get<TestSuite>(`${BASE(projectId)}/${id}`)
      .then((response) => response.data),
  create: (projectId: string, input: CreateTestSuite) =>
    client
      .post<TestSuite>(BASE(projectId), input)
      .then((response) => response.data),
  update: (projectId: string, id: string, input: UpdateTestSuite) =>
    client
      .put<TestSuite>(`${BASE(projectId)}/${id}`, { ...input, id })
      .then((response) => response.data),
  delete: (projectId: string, id: string) =>
    client.delete(`${BASE(projectId)}/${id}`),
};

export const testSuiteQueries = {
  all: (projectId: string, search?: string) =>
    queryOptions({
      queryKey: [...queryKeys.testSuites.all(projectId), search],
      queryFn: () => testSuitesApi.getAll(projectId, search),
      enabled: !!projectId,
    }),
  detail: (projectId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testSuites.detail(projectId, id),
      queryFn: () => testSuitesApi.getById(projectId, id),
      enabled: !!projectId && !!id,
    }),
};
