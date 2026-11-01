import { testRunsApi } from "@/features/testRuns/api";
import { useTicketedSocket } from "@/hooks/useTicketedSocket";

export const useTestRunSocket = (
  projectId: string,
  runId: string | undefined,
  handlers: Record<string, (data: unknown) => void>,
  onReconnected?: () => void,
) =>
  useTicketedSocket({
    key: runId ? `${projectId}/${runId}` : null,
    path: `/ws/runs/${runId}`,
    getTicket: () => testRunsApi.createSocketTicket(projectId, runId!),
    onMessage: (event, data) => handlers[event]?.(data),
    onReconnected,
    notifyOutages: true,
  });
