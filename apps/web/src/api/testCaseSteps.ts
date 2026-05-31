import { queryOptions } from "@tanstack/react-query";
import type {
  BulkReorderStepsInput,
  CreateTestCaseStepInput,
  Paginated,
  TestCaseStep,
  UpdateTestCaseStepInput,
} from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { PAGE_SIZE } from "@/lib/constants";

const BASE = (projectId: string, suiteId: string, caseId: string) =>
  `projects/${projectId}/suites/${suiteId}/cases/${caseId}/steps`;

export const testCaseStepsApi = {
  getAll: (projectId: string, suiteId: string, caseId: string) =>
    client
      .get<Paginated<TestCaseStep>>(BASE(projectId, suiteId, caseId), {
        params: { pageSize: PAGE_SIZE },
      })
      .then((r) => r.data),
  getById: (projectId: string, suiteId: string, caseId: string, id: string) =>
    client
      .get<TestCaseStep>(`${BASE(projectId, suiteId, caseId)}/${id}`)
      .then((r) => r.data),
  create: (
    projectId: string,
    suiteId: string,
    caseId: string,
    dto: CreateTestCaseStepInput,
  ) =>
    client
      .post<TestCaseStep>(BASE(projectId, suiteId, caseId), dto)
      .then((r) => r.data),
  update: (
    projectId: string,
    suiteId: string,
    caseId: string,
    id: string,
    dto: UpdateTestCaseStepInput,
  ) =>
    client
      .put<TestCaseStep>(`${BASE(projectId, suiteId, caseId)}/${id}`, dto)
      .then((r) => r.data),
  bulkReorder: (
    projectId: string,
    suiteId: string,
    caseId: string,
    dto: BulkReorderStepsInput,
  ) => client.put(`${BASE(projectId, suiteId, caseId)}/reorder`, dto),
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
