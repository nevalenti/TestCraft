import { queryOptions } from "@tanstack/react-query";

import { queryKeys } from "@/api/queryKeys";
import * as sdk from "@/api/sdk";

export const analyticsApi = {
  getTrend: async (projectId: string, limit = 20) => {
    const { data } = await sdk.getRunTrend({
      path: { project_id: projectId },
      query: { limit },
    });
    return data;
  },
  getSuiteBreakdown: async (projectId: string, runId: string) => {
    const { data } = await sdk.getSuiteBreakdown({
      path: { project_id: projectId, run_id: runId },
    });
    return data;
  },
  getFlakyTests: async (projectId: string, minRuns = 3) => {
    const { data } = await sdk.getFlakyTests({
      path: { project_id: projectId },
      query: { min_runs: minRuns },
    });
    return data;
  },
  getRunComparison: async (
    projectId: string,
    runAId: string,
    runBId: string,
  ) => {
    const { data } = await sdk.getRunComparison({
      path: { project_id: projectId },
      query: { run_a_id: runAId, run_b_id: runBId },
    });
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
