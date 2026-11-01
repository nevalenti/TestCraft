import { useQueries, useQuery } from "@tanstack/react-query";
import type { TestRun } from "@testcraft/types";

import { dashboardQueries } from "@/features/dashboard/api";
import { testRunQueries } from "@/features/testRuns/api";

export const useDashboardSummary = () =>
  useQuery({
    ...dashboardQueries.summary(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 5000,
  });

export const DASHBOARD_COMPLETED_LIMIT = 50;

const byMostRecentlyUpdated = (runA: TestRun, runB: TestRun) =>
  runB.updated_at.localeCompare(runA.updated_at);

export const useDashboardRuns = (
  projectIds: string[],
  options?: {
    refetchInterval?: number | false;
    refetchIntervalInBackground?: boolean;
    staleTime?: number;
  },
) =>
  useQueries({
    queries: [
      ...projectIds.map((projectId) => ({
        ...testRunQueries.active(projectId),
        ...options,
      })),
      ...projectIds.map((projectId) => ({
        ...testRunQueries.recentlyCompleted(
          projectId,
          DASHBOARD_COMPLETED_LIMIT,
        ),
        ...options,
      })),
    ],
    combine: (results) => {
      const active = results.slice(0, projectIds.length);
      const completed = results.slice(projectIds.length);
      const sumTotals = (pages: typeof results) =>
        pages.reduce((sum, result) => sum + (result.data?.total ?? 0), 0);

      return {
        activeRuns: active.flatMap((result) => result.data?.items ?? []),
        completedRuns: completed
          .flatMap((result) => result.data?.items ?? [])
          .toSorted(byMostRecentlyUpdated)
          .slice(0, DASHBOARD_COMPLETED_LIMIT),
        activeCount: sumTotals(active),
        completedCount: sumTotals(completed),
        isError: results.some((result) => result.isError),
        error: results.find((result) => result.isError)?.error,
        refetch: () =>
          Promise.all(
            results
              .filter((result) => result.isError)
              .map((result) => result.refetch()),
          ),
        isPending:
          results.length !== projectIds.length * 2 ||
          results.some((result) => result.isPending),
      };
    },
  });
