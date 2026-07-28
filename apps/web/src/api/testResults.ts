import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type {
  CreateTestResult,
  Paginated,
  TestResult,
  TestResultStatus,
  UpdateTestResult,
} from '@testcraft/types';

import client from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { RESULTS_PAGE_SIZE } from '@/lib/constants';

const BASE = (projectId: string, runId: string) =>
  `projects/${projectId}/runs/${runId}/results`;

export const testResultsApi = {
  getAll: async (
    projectId: string,
    runId: string,
    status?: TestResultStatus,
    search?: string,
    page = 1,
    pageSize = RESULTS_PAGE_SIZE,
  ) => {
    const { data } = await client.get<Paginated<TestResult>>(
      BASE(projectId, runId),
      {
        params: {
          page,
          pageSize,
          ...(status !== undefined && { status }),
          ...(search && { search }),
        },
      },
    );
    return data;
  },
  getById: async (projectId: string, runId: string, id: string) => {
    const { data } = await client.get<TestResult>(
      `${BASE(projectId, runId)}/${id}`,
    );
    return data;
  },
  create: async (projectId: string, runId: string, input: CreateTestResult) => {
    const { data } = await client.post<TestResult>(
      BASE(projectId, runId),
      input,
    );
    return data;
  },
  update: async (
    projectId: string,
    runId: string,
    id: string,
    input: UpdateTestResult,
  ) => {
    const { data } = await client.put<TestResult>(
      `${BASE(projectId, runId)}/${id}`,
      { ...input, id },
    );
    return data;
  },
  delete: (projectId: string, runId: string, id: string) =>
    client.delete(`${BASE(projectId, runId)}/${id}`),
};

export const testResultQueries = {
  all: (
    projectId: string,
    runId: string,
    status?: TestResultStatus,
    search?: string,
    page = 1,
  ) =>
    queryOptions({
      queryKey: [
        ...queryKeys.testResults.all(projectId, runId),
        status,
        search,
        page,
      ],
      queryFn: () =>
        testResultsApi.getAll(projectId, runId, status, search, page),
      enabled: !!projectId && !!runId,
      placeholderData: keepPreviousData,
    }),
  detail: (projectId: string, runId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testResults.detail(projectId, runId, id),
      queryFn: () => testResultsApi.getById(projectId, runId, id),
      enabled: !!projectId && !!runId && !!id,
    }),
};
