import { createFileRoute } from "@tanstack/react-router";

import { testPlanQueries } from "@/features/testPlans/api";
import { PlansTab } from "@/pages/project/PlansTab";
export const Route = createFileRoute("/_app/projects/$projectId/plans")({
  component: PlansTab,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(testPlanQueries.all(params.projectId)),
});
