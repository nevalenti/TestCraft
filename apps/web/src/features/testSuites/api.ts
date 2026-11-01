import { queryOptions } from "@tanstack/react-query";
import type { CreateTestSuite, UpdateTestSuite } from "@testcraft/types";

import { fetchAllPages } from "@/api/fetchAllPages";
import { ifMatch } from "@/api/ifMatch";
import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";
import { PAGE_SIZE } from "@/lib/constants";

export const testSuitesApi = {
  getAll: async (projectId: string, search?: string) => {
    return fetchAllPages(async (page) => {
      const { data } = await sdk.listTestSuites({
        path: { project_id: projectId },
        query: { page, page_size: PAGE_SIZE, ...(search && { search }) },
      });
      return data;
    });
  },
  getById: async (projectId: string, id: string) => {
    const { data } = await sdk.getTestSuite({
      path: { project_id: projectId, suite_id: id },
    });
    return data;
  },
  create: async (projectId: string, input: CreateTestSuite) => {
    const { data } = await sdk.createTestSuite({
      path: { project_id: projectId },
      body: input,
    });
    return data;
  },
  update: async (
    projectId: string,
    id: string,
    input: UpdateTestSuite,
    version: number,
  ) => {
    const { data } = await sdk.updateTestSuite({
      path: { project_id: projectId, suite_id: id },
      body: input,
      headers: ifMatch(version),
    });
    return data;
  },
  delete: (projectId: string, id: string) =>
    sdk.deleteTestSuite({
      path: { project_id: projectId, suite_id: id },
    }),
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
