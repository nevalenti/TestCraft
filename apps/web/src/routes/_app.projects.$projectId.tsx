import { createFileRoute } from "@tanstack/react-router";

import { projectQueries } from "@/features/projects/api";
import { ProjectLayout } from "@/pages/project/ProjectLayout";
export const Route = createFileRoute("/_app/projects/$projectId")({
  component: ProjectLayout,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(projectQueries.detail(params.projectId)),
});
