import { createFileRoute, redirect } from "@tanstack/react-router";

import { personalNoteQueries } from "@/features/notes/api";
import { latestNote } from "@/features/notes/noteDates";
import { isSideBySideLayout } from "@/features/notes/workspace/noteLayout";
import { NotesIndexPage } from "@/pages/notes/NotesIndexPage";
export const Route = createFileRoute("/_app/notes/")({
  component: NotesIndexPage,
  beforeLoad: async ({ context: { queryClient } }) => {
    if (!isSideBySideLayout()) return;
    const notes = await queryClient.ensureQueryData(personalNoteQueries.all());
    const latest = latestNote(notes.items);
    if (latest)
      throw redirect({
        to: "/notes/$noteId",
        params: { noteId: latest.id },
        replace: true,
      });
  },
});
