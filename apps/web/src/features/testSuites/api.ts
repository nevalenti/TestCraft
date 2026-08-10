import { queryOptions } from '@tanstack/react-query';
import type {
  CreateTestSuite,
  Paginated,
  TestSuite,
  UpdateTestSuite,
} from '@testcraft/types';

import client from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { PAGE_SIZE } from '@/lib/constants';

const BASE = (projectId: string) => `projects/${projectId}/suites`;

export const testSuitesApi = {
  getAll: async (projectId: string, search?: string) => {
    const { data } = await client.get<Paginated<TestSuite>>(BASE(projectId), {
      params: { pageSize: PAGE_SIZE, ...(search && { search }) },
    });
    return data;
  },
  getById: async (projectId: string, id: string) => {
    const { data } = await client.get<TestSuite>(`${BASE(projectId)}/${id}`);
    return data;
  },
  create: async (projectId: string, input: CreateTestSuite) => {
    const { data } = await client.post<TestSuite>(BASE(projectId), input);
    return data;
  },
  update: async (projectId: string, id: string, input: UpdateTestSuite) => {
    const { data } = await client.put<TestSuite>(`${BASE(projectId)}/${id}`, {
      ...input,
      id,
    });
    return data;
  },
  delete: (projectId: string, id: string) =>
    client.delete(`${BASE(projectId)}/${id}`),
};

export const testSuiteQueries = {
  all: (projectId: string, search?: string) =>
    queryOptions({
      queryKey: [...queryKeys.testSuites.all(projectId), search],
      queryFn: () => testSuitesApi.getAll(projectId, search),
      enabled: !!projectId,
    }),
  detail: (projectId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testSuites.detail(projectId, id),
      queryFn: () => testSuitesApi.getById(projectId, id),
      enabled: !!projectId && !!id,
    }),
};
