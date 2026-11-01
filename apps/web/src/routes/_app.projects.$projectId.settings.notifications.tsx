import { createFileRoute } from "@tanstack/react-router";

import { NotificationsTab } from "@/pages/project/settings/NotificationsTab";
export const Route = createFileRoute(
  "/_app/projects/$projectId/settings/notifications",
)({
  component: NotificationsTab,
});
