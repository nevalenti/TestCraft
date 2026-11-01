import { createFileRoute } from "@tanstack/react-router";

import { projectQueries } from "@/features/projects/api";
import { testCaseQueries } from "@/features/testCases/api";
import { testCaseStepQueries } from "@/features/testCaseSteps/api";
import { testSuiteQueries } from "@/features/testSuites/api";
import { CasePage } from "@/pages/case/CasePage";
export const Route = createFileRoute(
  "/_app/projects/$projectId_/suites_/$suiteId_/cases/$caseId",
)({
  component: CasePage,
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(projectQueries.detail(params.projectId)),
      queryClient.ensureQueryData(
        testSuiteQueries.detail(params.projectId, params.suiteId),
      ),
      queryClient.ensureQueryData(
        testCaseQueries.detail(params.projectId, params.suiteId, params.caseId),
      ),
      queryClient.ensureQueryData(
        testCaseStepQueries.all(
          params.projectId,
          params.suiteId,
          params.caseId,
        ),
      ),
    ]),
});
