import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsFlakyTab } from "@/pages/project/analytics/AnalyticsFlakyTab";
export const Route = createFileRoute(
  "/_app/projects/$projectId/analytics/flaky",
)({
  component: AnalyticsFlakyTab,
});
