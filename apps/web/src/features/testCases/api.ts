import { queryOptions } from '@tanstack/react-query';
import type {
  CreateTestCase,
  Paginated,
  TestCase,
  UpdateTestCase,
} from '@testcraft/types';

import client from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { PAGE_SIZE } from '@/lib/constants';

const BASE = (projectId: string, suiteId: string) =>
  `projects/${projectId}/suites/${suiteId}/cases`;

export const testCasesApi = {
  getAllByProject: async (projectId: string) => {
    const { data } = await client.get<Paginated<TestCase>>(
      `projects/${projectId}/cases`,
      {
        params: { pageSize: PAGE_SIZE },
      },
    );
    return data;
  },
  getAll: async (projectId: string, suiteId: string, search?: string) => {
    const { data } = await client.get<Paginated<TestCase>>(
      BASE(projectId, suiteId),
      {
        params: { pageSize: PAGE_SIZE, ...(search && { search }) },
      },
    );
    return data;
  },
  getById: async (projectId: string, suiteId: string, id: string) => {
    const { data } = await client.get<TestCase>(
      `${BASE(projectId, suiteId)}/${id}`,
    );
    return data;
  },
  create: async (projectId: string, suiteId: string, input: CreateTestCase) => {
    const { data } = await client.post<TestCase>(
      BASE(projectId, suiteId),
      input,
    );
    return data;
  },
  update: async (
    projectId: string,
    suiteId: string,
    id: string,
    input: UpdateTestCase,
  ) => {
    const { data } = await client.put<TestCase>(
      `${BASE(projectId, suiteId)}/${id}`,
      { ...input, id },
    );
    return data;
  },
  delete: (projectId: string, suiteId: string, id: string) =>
    client.delete(`${BASE(projectId, suiteId)}/${id}`),
};

export const testCaseQueries = {
  byProject: (projectId: string) =>
    queryOptions({
      queryKey: queryKeys.testCases.byProject(projectId),
      queryFn: () => testCasesApi.getAllByProject(projectId),
      enabled: !!projectId,
    }),
  all: (projectId: string, suiteId: string, search?: string) =>
    queryOptions({
      queryKey: [...queryKeys.testCases.all(projectId, suiteId), search],
      queryFn: () => testCasesApi.getAll(projectId, suiteId, search),
      enabled: !!projectId && !!suiteId,
    }),
  detail: (projectId: string, suiteId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testCases.detail(projectId, suiteId, id),
      queryFn: () => testCasesApi.getById(projectId, suiteId, id),
      enabled: !!projectId && !!suiteId && !!id,
    }),
};
