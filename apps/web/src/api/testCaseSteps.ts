import { queryOptions } from "@tanstack/react-query";
import type {
  BulkReorderSteps,
  CreateTestCaseStep,
  Paginated,
  TestCaseStep,
  UpdateTestCaseStep,
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
      .then((response) => response.data),
  getById: (projectId: string, suiteId: string, caseId: string, id: string) =>
    client
      .get<TestCaseStep>(`${BASE(projectId, suiteId, caseId)}/${id}`)
      .then((response) => response.data),
  create: (
    projectId: string,
    suiteId: string,
    caseId: string,
    input: CreateTestCaseStep,
  ) =>
    client
      .post<TestCaseStep>(BASE(projectId, suiteId, caseId), input)
      .then((response) => response.data),
  update: (
    projectId: string,
    suiteId: string,
    caseId: string,
    id: string,
    input: UpdateTestCaseStep,
  ) =>
    client
      .put<TestCaseStep>(`${BASE(projectId, suiteId, caseId)}/${id}`, {
        ...input,
        id,
      })
      .then((response) => response.data),
  bulkReorder: (
    projectId: string,
    suiteId: string,
    caseId: string,
    input: BulkReorderSteps,
  ) => client.put(`${BASE(projectId, suiteId, caseId)}/reorder`, input),
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
