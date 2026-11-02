import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsTrendTab } from "@/pages/project/analytics/AnalyticsTrendTab";
export const Route = createFileRoute(
  "/_app/projects/$projectId/analytics/trend",
)({
  component: AnalyticsTrendTab,
});
