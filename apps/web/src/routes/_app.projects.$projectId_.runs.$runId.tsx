import { createFileRoute } from "@tanstack/react-router";

import { projectQueries } from "@/features/projects/api";
import { testResultQueries } from "@/features/testResults/api";
import { testRunQueries } from "@/features/testRuns/api";
import { RunPage } from "@/pages/run/RunPage";
import { validateRunPageSearch } from "@/pages/run/runPageSearch";
export const Route = createFileRoute("/_app/projects/$projectId_/runs/$runId")({
  component: RunPage,
  validateSearch: validateRunPageSearch,
  loaderDeps: ({ search: { status, q } }) => ({ status, q }),
  loader: ({ context: { queryClient }, params, deps }) =>
    Promise.all([
      queryClient.ensureQueryData(projectQueries.detail(params.projectId)),
      queryClient.ensureQueryData(
        testRunQueries.detail(params.projectId, params.runId),
      ),
      queryClient.ensureQueryData(
        testRunQueries.summary(params.projectId, params.runId),
      ),
      queryClient.ensureQueryData(
        testResultQueries.all(
          params.projectId,
          params.runId,
          deps.status,
          deps.q,
        ),
      ),
    ]),
});
