import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsSuiteTab } from "@/pages/project/analytics/AnalyticsSuiteTab";
export const Route = createFileRoute(
  "/_app/projects/$projectId/analytics/suite",
)({
  component: AnalyticsSuiteTab,
});
