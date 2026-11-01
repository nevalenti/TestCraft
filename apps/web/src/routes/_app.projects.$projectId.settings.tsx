import { createFileRoute } from "@tanstack/react-router";

import { ProjectSettingsLayout } from "@/pages/project/settings/ProjectSettingsLayout";
export const Route = createFileRoute("/_app/projects/$projectId/settings")({
  component: ProjectSettingsLayout,
});
