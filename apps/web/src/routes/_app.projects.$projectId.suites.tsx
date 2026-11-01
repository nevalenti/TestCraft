import { createFileRoute } from "@tanstack/react-router";

import { testSuiteQueries } from "@/features/testSuites/api";
import { SuitesTab } from "@/pages/project/SuitesTab";
export const Route = createFileRoute("/_app/projects/$projectId/suites")({
  component: SuitesTab,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(testSuiteQueries.all(params.projectId)),
});
