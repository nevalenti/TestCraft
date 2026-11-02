import { createFileRoute } from "@tanstack/react-router";

import { projectQueries } from "@/features/projects/api";
import { testPlanQueries } from "@/features/testPlans/api";
import { PlanPage } from "@/pages/plan/PlanPage";
export const Route = createFileRoute(
  "/_app/projects/$projectId_/plans/$planId",
)({
  component: PlanPage,
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(projectQueries.detail(params.projectId)),
      queryClient.ensureQueryData(
        testPlanQueries.detail(params.projectId, params.planId),
      ),
      queryClient.ensureQueryData(
        testPlanQueries.cases(params.projectId, params.planId),
      ),
    ]),
});
