import { queryOptions } from "@tanstack/react-query";
import type {
  CreateTestCaseInput,
  Paginated,
  TestCase,
  UpdateTestCaseInput,
} from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { PAGE_SIZE } from "@/lib/constants";

const BASE = (projectId: string, suiteId: string) =>
  `projects/${projectId}/suites/${suiteId}/cases`;

export const testCasesApi = {
  getAllByProject: (projectId: string) =>
    client
      .get<Paginated<TestCase>>(`projects/${projectId}/cases`, {
        params: { pageSize: PAGE_SIZE },
      })
      .then((response) => response.data),
  getAll: (projectId: string, suiteId: string, search?: string) =>
    client
      .get<Paginated<TestCase>>(BASE(projectId, suiteId), {
        params: { pageSize: PAGE_SIZE, ...(search ? { search } : {}) },
      })
      .then((response) => response.data),
  getById: (projectId: string, suiteId: string, id: string) =>
    client
      .get<TestCase>(`${BASE(projectId, suiteId)}/${id}`)
      .then((response) => response.data),
  create: (projectId: string, suiteId: string, input: CreateTestCaseInput) =>
    client
      .post<TestCase>(BASE(projectId, suiteId), input)
      .then((response) => response.data),
  update: (
    projectId: string,
    suiteId: string,
    id: string,
    input: UpdateTestCaseInput,
  ) =>
    client
      .put<TestCase>(`${BASE(projectId, suiteId)}/${id}`, input)
      .then((response) => response.data),
  delete: (projectId: string, suiteId: string, id: string) =>
    client.delete(`${BASE(projectId, suiteId)}/${id}`),
};

export const testCaseQueries = {
  byProject: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.testCases.byProject(projectId),
      queryFn: () => testCasesApi.getAllByProject(projectId),
      enabled: !!projectId,
    }),
  all: (projectId: string, suiteId: string, search?: string) =>
    queryOptions({
      queryKey: [...queryKeys.testCases.all(projectId, suiteId), search],
      queryFn: () => testCasesApi.getAll(projectId, suiteId, search),
      enabled: !!projectId && !!suiteId,
    }),
  detail: (projectId: string, suiteId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testCases.detail(projectId, suiteId, id),
      queryFn: () => testCasesApi.getById(projectId, suiteId, id),
      enabled: !!projectId && !!suiteId && !!id,
    }),
};
