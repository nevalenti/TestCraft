import { queryOptions } from "@tanstack/react-query";
import type { CreateTestCase, UpdateTestCase } from "@testcraft/types";

import { fetchAllPages } from "@/api/fetchAllPages";
import { ifMatch } from "@/api/ifMatch";
import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";
import { PAGE_SIZE } from "@/lib/constants";

export const testCasesApi = {
  getAllByProject: async (projectId: string) => {
    return fetchAllPages(async (page) => {
      const { data } = await sdk.listTestCasesByProject({
        path: { project_id: projectId },
        query: { page, page_size: PAGE_SIZE },
      });
      return data;
    });
  },
  getAll: async (projectId: string, suiteId: string, search?: string) => {
    return fetchAllPages(async (page) => {
      const { data } = await sdk.listTestCases({
        path: { project_id: projectId, suite_id: suiteId },
        query: { page, page_size: PAGE_SIZE, ...(search && { search }) },
      });
      return data;
    });
  },
  getById: async (projectId: string, suiteId: string, id: string) => {
    const { data } = await sdk.getTestCase({
      path: { project_id: projectId, suite_id: suiteId, case_id: id },
    });
    return data;
  },
  create: async (projectId: string, suiteId: string, input: CreateTestCase) => {
    const { data } = await sdk.createTestCase({
      path: { project_id: projectId, suite_id: suiteId },
      body: input,
    });
    return data;
  },
  update: async (
    projectId: string,
    suiteId: string,
    id: string,
    input: UpdateTestCase,
    version: number,
  ) => {
    const { data } = await sdk.updateTestCase({
      path: { project_id: projectId, suite_id: suiteId, case_id: id },
      body: input,
      headers: ifMatch(version),
    });
    return data;
  },
  delete: (projectId: string, suiteId: string, id: string) =>
    sdk.deleteTestCase({
      path: { project_id: projectId, suite_id: suiteId, case_id: id },
    }),
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
