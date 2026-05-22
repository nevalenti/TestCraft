import { queryOptions } from "@tanstack/react-query";

import type {
  CreateTestCaseDto,
  TestCaseDto,
  UpdateTestCaseDto,
} from "@/types";

import client from "./client";
import { queryKeys } from "./queryKeys";

const BASE = (projectId: string, suiteId: string) =>
  `/api/v1/projects/${projectId}/suites/${suiteId}/cases`;

export const testCasesApi = {
  getAllByProject: (projectId: string) =>
    client
      .get<TestCaseDto[]>(`/api/v1/projects/${projectId}/cases`)
      .then((r) => r.data),
  getAll: (projectId: string, suiteId: string, search?: string) =>
    client
      .get<TestCaseDto[]>(BASE(projectId, suiteId), {
        params: search ? { search } : undefined,
      })
      .then((r) => r.data),
  getById: (projectId: string, suiteId: string, id: string) =>
    client
      .get<TestCaseDto>(`${BASE(projectId, suiteId)}/${id}`)
      .then((r) => r.data),
  create: (projectId: string, suiteId: string, dto: CreateTestCaseDto) =>
    client.post<TestCaseDto>(BASE(projectId, suiteId), dto).then((r) => r.data),
  update: (
    projectId: string,
    suiteId: string,
    id: string,
    dto: UpdateTestCaseDto,
  ) =>
    client
      .put<TestCaseDto>(`${BASE(projectId, suiteId)}/${id}`, dto)
      .then((r) => r.data),
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
