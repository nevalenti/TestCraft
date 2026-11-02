import { createFileRoute } from "@tanstack/react-router";

import { personalNoteQueries } from "@/features/notes/api";
import { NotesLayout } from "@/pages/notes/NotesLayout";
export const Route = createFileRoute("/_app/notes")({
  component: NotesLayout,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(personalNoteQueries.all()),
});
