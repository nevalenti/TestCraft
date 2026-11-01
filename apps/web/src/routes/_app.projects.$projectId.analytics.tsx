import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsLayout } from "@/pages/project/analytics/AnalyticsLayout";
export const Route = createFileRoute("/_app/projects/$projectId/analytics")({
  component: AnalyticsLayout,
});
