import { queryOptions } from '@tanstack/react-query';
import type {
  CreateTestPlan,
  TestPlan,
  TestPlanCase,
  UpdateTestPlan,
} from '@testcraft/types';

import client from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

const BASE = (projectId: string) => `projects/${projectId}/plans`;

export const testPlansApi = {
  getAll: async (projectId: string) => {
    const { data } = await client.get<TestPlan[]>(BASE(projectId));
    return data;
  },
  getById: async (projectId: string, planId: string) => {
    const { data } = await client.get<TestPlan>(`${BASE(projectId)}/${planId}`);
    return data;
  },
  getCases: async (projectId: string, planId: string) => {
    const { data } = await client.get<TestPlanCase[]>(
      `${BASE(projectId)}/${planId}/cases`,
    );
    return data;
  },
  create: async (projectId: string, input: CreateTestPlan) => {
    const { data } = await client.post<TestPlan>(BASE(projectId), input);
    return data;
  },
  update: async (projectId: string, planId: string, input: UpdateTestPlan) => {
    const { data } = await client.put<TestPlan>(
      `${BASE(projectId)}/${planId}`,
      input,
    );
    return data;
  },
  delete: (projectId: string, planId: string) =>
    client.delete(`${BASE(projectId)}/${planId}`),
  addCase: (projectId: string, planId: string, caseId: string) =>
    client.post(`${BASE(projectId)}/${planId}/cases`, { testCaseId: caseId }),
  removeCase: (projectId: string, planId: string, caseId: string) =>
    client.delete(`${BASE(projectId)}/${planId}/cases/${caseId}`),
  reorderCases: (
    projectId: string,
    planId: string,
    cases: { testCaseId: string; order: number }[],
  ) => client.put(`${BASE(projectId)}/${planId}/cases/order`, { cases }),
  createRun: async (
    projectId: string,
    planId: string,
    input: { name: string; environment: string },
  ) => {
    const { data } = await client.post(
      `${BASE(projectId)}/${planId}/run`,
      input,
    );
    return data;
  },
};

export const testPlanQueries = {
  all: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.testPlans.all(projectId),
      queryFn: () => testPlansApi.getAll(projectId),
      enabled: !!projectId,
    }),
  detail: (projectId: string, planId: string) =>
    queryOptions({
      queryKey: queryKeys.testPlans.detail(projectId, planId),
      queryFn: () => testPlansApi.getById(projectId, planId),
      enabled: !!projectId && !!planId,
    }),
  cases: (projectId: string, planId: string) =>
    queryOptions({
      queryKey: queryKeys.testPlans.cases(projectId, planId),
      queryFn: () => testPlansApi.getCases(projectId, planId),
      enabled: !!projectId && !!planId,
    }),
};
