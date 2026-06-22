import { queryOptions } from "@tanstack/react-query";
import type {
  FlakyTestStat,
  RunComparison,
  SuiteBreakdown,
  TrendPoint,
} from "@testcraft/types";

import client from "@/api/client";
import { queryKeys } from "@/api/queryKeys";

const BASE = (projectId: string) => `projects/${projectId}/analytics`;

export const analyticsApi = {
  getTrend: async (projectId: string, limit = 20) => {
    const { data } = await client.get<TrendPoint[]>(
      `${BASE(projectId)}/trend`,
      { params: { limit } },
    );
    return data;
  },
  getSuiteBreakdown: async (projectId: string, runId: string) => {
    const { data } = await client.get<SuiteBreakdown[]>(
      `${BASE(projectId)}/runs/${runId}/suite-breakdown`,
    );
    return data;
  },
  getFlakyTests: async (projectId: string, minRuns = 3) => {
    const { data } = await client.get<FlakyTestStat[]>(
      `${BASE(projectId)}/flaky`,
      { params: { minRuns } },
    );
    return data;
  },
  getRunComparison: async (
    projectId: string,
    runAId: string,
    runBId: string,
  ) => {
    const { data } = await client.get<RunComparison>(
      `${BASE(projectId)}/runs/compare`,
      { params: { runAId, runBId } },
    );
    return data;
  },
};

export const analyticsQueries = {
  trend: (projectId: string, limit = 20) =>
    queryOptions({
      queryKey: queryKeys.analytics.trend(projectId, limit),
      queryFn: () => analyticsApi.getTrend(projectId, limit),
      enabled: !!projectId,
    }),
  suiteBreakdown: (projectId: string, runId: string) =>
    queryOptions({
      queryKey: queryKeys.analytics.suiteBreakdown(projectId, runId),
      queryFn: () => analyticsApi.getSuiteBreakdown(projectId, runId),
      enabled: !!projectId && !!runId,
    }),
  flakyTests: (projectId: string, minRuns = 3) =>
    queryOptions({
      queryKey: queryKeys.analytics.flakyTests(projectId, minRuns),
      queryFn: () => analyticsApi.getFlakyTests(projectId, minRuns),
      enabled: !!projectId,
    }),
  runComparison: (projectId: string, runAId: string, runBId: string) =>
    queryOptions({
      queryKey: queryKeys.analytics.runComparison(projectId, runAId, runBId),
      queryFn: () => analyticsApi.getRunComparison(projectId, runAId, runBId),
      enabled: !!projectId && !!runAId && !!runBId,
    }),
};
