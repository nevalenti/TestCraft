import { queryOptions } from "@tanstack/react-query";

import type {
  CreateTestSuiteDto,
  TestSuiteDto,
  UpdateTestSuiteDto,
} from "@/types";

import client from "./client";
import { queryKeys } from "./queryKeys";

const BASE = (projectId: string) => `/api/v1/projects/${projectId}/suites`;

export const testSuitesApi = {
  getAll: (projectId: string) =>
    client.get<TestSuiteDto[]>(BASE(projectId)).then((r) => r.data),
  getById: (projectId: string, id: string) =>
    client.get<TestSuiteDto>(`${BASE(projectId)}/${id}`).then((r) => r.data),
  create: (projectId: string, dto: CreateTestSuiteDto) =>
    client.post<TestSuiteDto>(BASE(projectId), dto).then((r) => r.data),
  update: (projectId: string, id: string, dto: UpdateTestSuiteDto) =>
    client
      .put<TestSuiteDto>(`${BASE(projectId)}/${id}`, dto)
      .then((r) => r.data),
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
