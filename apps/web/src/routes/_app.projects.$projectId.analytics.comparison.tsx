import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsComparisonTab } from "@/pages/project/analytics/AnalyticsComparisonTab";
export const Route = createFileRoute(
  "/_app/projects/$projectId/analytics/comparison",
)({
  component: AnalyticsComparisonTab,
});
