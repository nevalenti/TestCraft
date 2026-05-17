import { queryOptions } from "@tanstack/react-query";

import type {
  CreateTestCaseStepDto,
  TestCaseStepDto,
  UpdateTestCaseStepDto,
} from "@/types";

import client from "./client";
import { queryKeys } from "./queryKeys";

const BASE = (projectId: string, suiteId: string, caseId: string) =>
  `/api/v1/projects/${projectId}/suites/${suiteId}/cases/${caseId}/steps`;

export const testCaseStepsApi = {
  getAll: (projectId: string, suiteId: string, caseId: string) =>
    client
      .get<TestCaseStepDto[]>(BASE(projectId, suiteId, caseId))
      .then((r) => r.data),
  getById: (projectId: string, suiteId: string, caseId: string, id: string) =>
    client
      .get<TestCaseStepDto>(`${BASE(projectId, suiteId, caseId)}/${id}`)
      .then((r) => r.data),
  create: (
    projectId: string,
    suiteId: string,
    caseId: string,
    dto: CreateTestCaseStepDto,
  ) =>
    client
      .post<TestCaseStepDto>(BASE(projectId, suiteId, caseId), dto)
      .then((r) => r.data),
  update: (
    projectId: string,
    suiteId: string,
    caseId: string,
    id: string,
    dto: UpdateTestCaseStepDto,
  ) =>
    client
      .put<TestCaseStepDto>(`${BASE(projectId, suiteId, caseId)}/${id}`, dto)
      .then((r) => r.data),
  delete: (projectId: string, suiteId: string, caseId: string, id: string) =>
    client.delete(`${BASE(projectId, suiteId, caseId)}/${id}`),
};

export const testCaseStepQueries = {
  all: (projectId: string, suiteId: string, caseId: string) =>
    queryOptions({
      queryKey: queryKeys.testCaseSteps.all(projectId, suiteId, caseId),
      queryFn: () => testCaseStepsApi.getAll(projectId, suiteId, caseId),
      enabled: !!projectId && !!suiteId && !!caseId,
    }),
  detail: (projectId: string, suiteId: string, caseId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testCaseSteps.detail(projectId, suiteId, caseId, id),
      queryFn: () => testCaseStepsApi.getById(projectId, suiteId, caseId, id),
      enabled: !!projectId && !!suiteId && !!caseId && !!id,
    }),
};
