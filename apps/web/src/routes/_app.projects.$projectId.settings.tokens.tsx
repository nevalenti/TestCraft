import { createFileRoute } from "@tanstack/react-router";

import { ApiTokensTab } from "@/pages/project/settings/ApiTokensTab";
export const Route = createFileRoute(
  "/_app/projects/$projectId/settings/tokens",
)({
  component: ApiTokensTab,
});
