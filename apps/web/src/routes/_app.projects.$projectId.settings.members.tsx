import { createFileRoute } from "@tanstack/react-router";

import { MembersTab } from "@/pages/project/settings/MembersTab";
export const Route = createFileRoute(
  "/_app/projects/$projectId/settings/members",
)({
  component: MembersTab,
});
