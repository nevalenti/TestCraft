import { queryOptions } from "@tanstack/react-query";
import {
  type CreateTestRun,
  type RunLogPage,
  TestRunStatus,
  type UpdateTestRun,
} from "@testcraft/types";

import { fetchAllPages } from "@/api/fetchAllPages";
import { ifMatch } from "@/api/ifMatch";
import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";
import { PAGE_SIZE } from "@/lib/constants";

export interface RunLogs {
  lines: string[];
  earliestSeq: number | null;
  latestSeq: number | null;
  hasMore: boolean;
}

const toRunLogs = (page: RunLogPage): RunLogs => ({
  lines: page.items.map((item) => item.message),
  earliestSeq: page.items[0]?.seq ?? null,
  latestSeq: page.items.at(-1)?.seq ?? null,
  hasMore: page.has_more,
});

export const testRunsApi = {
  getAll: async (projectId: string, search?: string) => {
    return fetchAllPages(async (page) => {
      const { data } = await sdk.listTestRuns({
        path: { project_id: projectId },
        query: { page, page_size: PAGE_SIZE, ...(search && { search }) },
      });
      return data;
    });
  },
  getActive: async (projectId: string) => {
    return fetchAllPages(async (page) => {
      const { data } = await sdk.listTestRuns({
        path: { project_id: projectId },
        query: { page, page_size: PAGE_SIZE, status: TestRunStatus.Active },
      });
      return data;
    });
  },
  getRecentlyCompleted: async (projectId: string, limit: number) => {
    const { data } = await sdk.listTestRuns({
      path: { project_id: projectId },
      query: {
        page: 1,
        page_size: limit,
        status: TestRunStatus.Completed,
        sort_by: "updated_at",
      },
    });
    return data;
  },
  getById: async (projectId: string, id: string) => {
    const { data } = await sdk.getTestRun({
      path: { project_id: projectId, run_id: id },
    });
    return data;
  },
  create: async (projectId: string, input: CreateTestRun) => {
    const { data } = await sdk.createTestRun({
      path: { project_id: projectId },
      body: input,
    });
    return data;
  },
  update: async (
    projectId: string,
    id: string,
    input: UpdateTestRun,
    version: number,
  ) => {
    const { data } = await sdk.updateTestRun({
      path: { project_id: projectId, run_id: id },
      body: input,
      headers: ifMatch(version),
    });
    return data;
  },
  delete: (projectId: string, id: string) =>
    sdk.deleteTestRun({ path: { project_id: projectId, run_id: id } }),
  getSummary: async (projectId: string, id: string) => {
    const { data } = await sdk.getTestRunSummary({
      path: { project_id: projectId, run_id: id },
    });
    return data;
  },
  getLogs: async (projectId: string, id: string, beforeSeq?: number) => {
    const { data } = await sdk.getTestRunLogs({
      path: { project_id: projectId, run_id: id },
      ...(beforeSeq !== undefined && { query: { before_seq: beforeSeq } }),
    });
    return toRunLogs(data);
  },
  createSocketTicket: async (projectId: string, id: string) => {
    const { data } = await sdk.createTestRunSocketTicket({
      path: { project_id: projectId, run_id: id },
    });
    return data.ticket;
  },
};

export const testRunQueries = {
  all: (projectId: string, search?: string) =>
    queryOptions({
      queryKey: [...queryKeys.testRuns.all(projectId), search],
      queryFn: () => testRunsApi.getAll(projectId, search),
      enabled: !!projectId,
    }),
  active: (projectId: string) =>
    queryOptions({
      queryKey: [...queryKeys.testRuns.all(projectId), "dashboard", "active"],
      queryFn: () => testRunsApi.getActive(projectId),
      enabled: !!projectId,
    }),
  recentlyCompleted: (projectId: string, limit: number) =>
    queryOptions({
      queryKey: [
        ...queryKeys.testRuns.all(projectId),
        "dashboard",
        "completed",
        limit,
      ],
      queryFn: () => testRunsApi.getRecentlyCompleted(projectId, limit),
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
  logs: (projectId: string, id: string) =>
    queryOptions({
      queryKey: queryKeys.testRuns.logs(projectId, id),
      queryFn: () => testRunsApi.getLogs(projectId, id),
      enabled: !!projectId && !!id,
      staleTime: 0,
      refetchOnWindowFocus: false,
    }),
};
