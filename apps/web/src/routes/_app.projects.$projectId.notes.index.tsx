import { createFileRoute, redirect } from "@tanstack/react-router";

import { projectNoteQueries } from "@/features/notes/api";
import { latestNote } from "@/features/notes/noteDates";
import { isSideBySideLayout } from "@/features/notes/workspace/noteLayout";
import { ProjectNotesIndexPage } from "@/pages/project/notes/ProjectNotesIndexPage";
export const Route = createFileRoute("/_app/projects/$projectId/notes/")({
  component: ProjectNotesIndexPage,
  beforeLoad: async ({ context: { queryClient }, params }) => {
    if (!isSideBySideLayout()) return;
    const notes = await queryClient.ensureQueryData(
      projectNoteQueries.all(params.projectId),
    );
    const latest = latestNote(notes.items);
    if (latest)
      throw redirect({
        to: "/projects/$projectId/notes/$noteId",
        params: { projectId: params.projectId, noteId: latest.id },
        replace: true,
      });
  },
});
