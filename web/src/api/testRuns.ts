import { queryOptions } from "@tanstack/react-query";
import type { CreateTestRunDto, TestRunDto, UpdateTestRunDto } from "@/types";
import client from "./client";
import { queryKeys } from "./queryKeys";

const BASE = (projectId: string) => `/api/v1/projects/${projectId}/runs`;

export const testRunsApi = {
  getAll: (projectId: string) =>
    client.get<TestRunDto[]>(BASE(projectId)).then((r) => r.data),
  getById: (projectId: string, id: string) =>
    client.get<TestRunDto>(`${BASE(projectId)}/${id}`).then((r) => r.data),
  create: (projectId: string, dto: CreateTestRunDto) =>
    client.post<TestRunDto>(BASE(projectId), dto).then((r) => r.data),
  update: (projectId: string, id: string, dto: UpdateTestRunDto) =>
    client.put<TestRunDto>(`${BASE(projectId)}/${id}`, dto).then((r) => r.data),
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
