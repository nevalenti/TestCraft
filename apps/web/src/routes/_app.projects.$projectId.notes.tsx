import { createFileRoute } from "@tanstack/react-router";

import { projectNoteQueries } from "@/features/notes/api";
import { ProjectNotesLayout } from "@/pages/project/notes/ProjectNotesLayout";
export const Route = createFileRoute("/_app/projects/$projectId/notes")({
  component: ProjectNotesLayout,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(projectNoteQueries.all(params.projectId)),
});
