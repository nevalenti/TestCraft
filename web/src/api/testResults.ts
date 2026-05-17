import { queryOptions } from "@tanstack/react-query";
import type {
  CreateTestResultDto,
  TestResultDto,
  UpdateTestResultDto,
} from "@/types";
import client from "./client";
import { queryKeys } from "./queryKeys";

const BASE = (projectId: string, runId: string) =>
  `/api/v1/projects/${projectId}/runs/${runId}/results`;

export const testResultsApi = {
  getAll: (projectId: string, runId: string) =>
    client.get<TestResultDto[]>(BASE(projectId, runId)).then((r) => r.data),
  getById: (projectId: string, runId: string, id: string) =>
    client
      .get<TestResultDto>(`${BASE(projectId, runId)}/${id}`)
      .then((r) => r.data),
  create: (projectId: string, runId: string, dto: CreateTestResultDto) =>
    client.post<TestResultDto>(BASE(projectId, runId), dto).then((r) => r.data),
  update: (
    projectId: string,
    runId: string,
    id: string,
    dto: UpdateTestResultDto,
  ) =>
    client
      .put<TestResultDto>(`${BASE(projectId, runId)}/${id}`, dto)
      .then((r) => r.data),
  delete: (projectId: string, runId: string, id: string) =>
    client.delete(`${BASE(projectId, runId)}/${id}`),
};

export const testResultQueries = {
  all: (projectId: string, runId: string) =>
    queryOptions({
      queryKey: queryKeys.testResults.all(projectId, runId),
      queryFn: () => testResultsApi.getAll(projectId, runId),
      enabled: !!projectId && !!runId,
    }),
  detail: (projectId: string, runId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testResults.detail(projectId, runId, id),
      queryFn: () => testResultsApi.getById(projectId, runId, id),
      enabled: !!projectId && !!runId && !!id,
    }),
};
