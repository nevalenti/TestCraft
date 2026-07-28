import { queryOptions } from '@tanstack/react-query';
import type {
  BulkReorderSteps,
  CreateTestCaseStep,
  Paginated,
  TestCaseStep,
  UpdateTestCaseStep,
} from '@testcraft/types';

import client from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { PAGE_SIZE } from '@/lib/constants';

const BASE = (projectId: string, suiteId: string, caseId: string) =>
  `projects/${projectId}/suites/${suiteId}/cases/${caseId}/steps`;

export const testCaseStepsApi = {
  getAll: async (projectId: string, suiteId: string, caseId: string) => {
    const { data } = await client.get<Paginated<TestCaseStep>>(
      BASE(projectId, suiteId, caseId),
      {
        params: { pageSize: PAGE_SIZE },
      },
    );
    return data;
  },
  getById: async (
    projectId: string,
    suiteId: string,
    caseId: string,
    id: string,
  ) => {
    const { data } = await client.get<TestCaseStep>(
      `${BASE(projectId, suiteId, caseId)}/${id}`,
    );
    return data;
  },
  create: async (
    projectId: string,
    suiteId: string,
    caseId: string,
    input: CreateTestCaseStep,
  ) => {
    const { data } = await client.post<TestCaseStep>(
      BASE(projectId, suiteId, caseId),
      input,
    );
    return data;
  },
  update: async (
    projectId: string,
    suiteId: string,
    caseId: string,
    id: string,
    input: UpdateTestCaseStep,
  ) => {
    const { data } = await client.put<TestCaseStep>(
      `${BASE(projectId, suiteId, caseId)}/${id}`,
      {
        ...input,
        id,
      },
    );
    return data;
  },
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
