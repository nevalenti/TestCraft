import { createFileRoute } from "@tanstack/react-router";

import { projectNoteQueries } from "@/features/notes/api";
import { ProjectNotePage } from "@/pages/project/notes/ProjectNotePage";
export const Route = createFileRoute("/_app/projects/$projectId/notes/$noteId")(
  {
    component: ProjectNotePage,
    loader: ({ context: { queryClient }, params }) =>
      queryClient.ensureQueryData(
        projectNoteQueries.detail(params.projectId, params.noteId),
      ),
  },
);
