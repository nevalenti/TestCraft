import { createFileRoute } from "@tanstack/react-router";

import { LabelsTab } from "@/pages/project/LabelsTab";
export const Route = createFileRoute("/_app/projects/$projectId/labels")({
  component: LabelsTab,
});
