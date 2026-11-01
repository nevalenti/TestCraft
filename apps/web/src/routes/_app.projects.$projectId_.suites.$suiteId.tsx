import { createFileRoute } from "@tanstack/react-router";

import { projectQueries } from "@/features/projects/api";
import { testCaseQueries } from "@/features/testCases/api";
import { testSuiteQueries } from "@/features/testSuites/api";
import { SuitePage } from "@/pages/suite/SuitePage";
export const Route = createFileRoute(
  "/_app/projects/$projectId_/suites/$suiteId",
)({
  component: SuitePage,
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(projectQueries.detail(params.projectId)),
      queryClient.ensureQueryData(
        testSuiteQueries.detail(params.projectId, params.suiteId),
      ),
      queryClient.ensureQueryData(
        testCaseQueries.all(params.projectId, params.suiteId),
      ),
    ]),
});
