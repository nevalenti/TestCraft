import { createFileRoute } from "@tanstack/react-router";

import { testRunQueries } from "@/features/testRuns/api";
import { RunsTab } from "@/pages/project/RunsTab";
export const Route = createFileRoute("/_app/projects/$projectId/runs")({
  component: RunsTab,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(testRunQueries.all(params.projectId)),
});
