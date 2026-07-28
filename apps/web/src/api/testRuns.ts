import { queryOptions } from '@tanstack/react-query';
import type {
  CreateTestRun,
  Paginated,
  TestRun,
  TestRunSummary,
  UpdateTestRun,
} from '@testcraft/types';

import client from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { PAGE_SIZE } from '@/lib/constants';

const BASE = (projectId: string) => `projects/${projectId}/runs`;

export const testRunsApi = {
  getAll: async (projectId: string, search?: string) => {
    const { data } = await client.get<Paginated<TestRun>>(BASE(projectId), {
      params: { pageSize: PAGE_SIZE, ...(search && { search }) },
    });
    return data;
  },
  getById: async (projectId: string, id: string) => {
    const { data } = await client.get<TestRun>(`${BASE(projectId)}/${id}`);
    return data;
  },
  create: async (projectId: string, input: CreateTestRun) => {
    const { data } = await client.post<TestRun>(BASE(projectId), input);
    return data;
  },
  update: async (projectId: string, id: string, input: UpdateTestRun) => {
    const { data } = await client.put<TestRun>(`${BASE(projectId)}/${id}`, {
      ...input,
      id,
    });
    return data;
  },
  delete: (projectId: string, id: string) =>
    client.delete(`${BASE(projectId)}/${id}`),
  getSummary: async (projectId: string, id: string) => {
    const { data } = await client.get<TestRunSummary>(
      `${BASE(projectId)}/${id}/summary`,
    );
    return data;
  },
  getLogs: async (projectId: string, id: string) => {
    const { data } = await client.get<string[]>(
      `${BASE(projectId)}/${id}/logs`,
    );
    return data;
  },
};

export const testRunQueries = {
  all: (projectId: string, search?: string) =>
    queryOptions({
      queryKey: [...queryKeys.testRuns.all(projectId), search],
      queryFn: () => testRunsApi.getAll(projectId, search),
      enabled: !!projectId,
    }),
  detail: (projectId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testRuns.detail(projectId, id),
      queryFn: () => testRunsApi.getById(projectId, id),
      enabled: !!projectId && !!id,
    }),
  summary: (projectId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testRuns.summary(projectId, id),
      queryFn: () => testRunsApi.getSummary(projectId, id),
      enabled: !!projectId && !!id,
    }),
};
