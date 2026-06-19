import { useQuery } from "@tanstack/react-query";

import { analyticsQueries } from "@/api/analytics";

export const useRunTrend = (projectId: string, limit = 20) =>
  useQuery(analyticsQueries.trend(projectId, limit));

export const useSuiteBreakdown = (projectId: string, runId?: string) =>
  useQuery(analyticsQueries.suiteBreakdown(projectId, runId ?? ""));

export const useFlakyTests = (projectId: string, minRuns = 3) =>
  useQuery(analyticsQueries.flakyTests(projectId, minRuns));

export const useRunComparison = (
  projectId: string,
  runAId?: string,
  runBId?: string,
) =>
  useQuery(
    analyticsQueries.runComparison(projectId, runAId ?? "", runBId ?? ""),
  );
