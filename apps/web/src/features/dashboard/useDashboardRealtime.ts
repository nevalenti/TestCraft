import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { queryKeys } from "@/api/queryKeys";
import { projectsApi } from "@/features/projects/api";
import { useThrottledCallback } from "@/hooks/useThrottledCallback";
import { useTicketedSocket } from "@/hooks/useTicketedSocket";

const DASHBOARD_REFRESH_INTERVAL_MS = 2000;

interface DashboardChange {
  project_id: string;
  run_id: string;
}

const isDashboardChange = (value: unknown): value is DashboardChange =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as DashboardChange).project_id === "string" &&
  typeof (value as DashboardChange).run_id === "string";

export const useDashboardRealtime = (projectIds: string[]) => {
  const queryClient = useQueryClient();
  const projectIdsKey = projectIds
    .toSorted((a, b) => a.localeCompare(b))
    .join(",");
  const pendingProjectIds = useRef(new Set<string>());

  const flushRefreshes = () => {
    for (const projectId of pendingProjectIds.current) {
      queryClient.invalidateQueries(
        { queryKey: queryKeys.testRuns.all(projectId) },
        { cancelRefetch: false },
      );
    }
    pendingProjectIds.current.clear();
    queryClient.invalidateQueries(
      { queryKey: queryKeys.dashboard.all },
      { cancelRefetch: false },
    );
    queryClient.invalidateQueries(
      { queryKey: [...queryKeys.projects.all, undefined], exact: true },
      { cancelRefetch: false },
    );
  };
  const scheduleRefresh = useThrottledCallback(
    flushRefreshes,
    DASHBOARD_REFRESH_INTERVAL_MS,
  );

  return useTicketedSocket({
    key: projectIdsKey || null,
    path: "/ws/dashboard",
    getTicket: projectsApi.createDashboardSocketTicket,
    onMessage: (event, data) => {
      if (event !== "run.changed" || !isDashboardChange(data)) return;
      pendingProjectIds.current.add(data.project_id);
      scheduleRefresh();
    },
    onReconnected: () => {
      for (const projectId of projectIdsKey.split(",")) {
        pendingProjectIds.current.add(projectId);
      }
      flushRefreshes();
    },
  });
};
