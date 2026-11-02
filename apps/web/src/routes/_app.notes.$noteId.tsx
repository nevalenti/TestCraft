import { createFileRoute } from "@tanstack/react-router";

import { personalNoteQueries } from "@/features/notes/api";
import { NotePage } from "@/pages/notes/NotePage";
export const Route = createFileRoute("/_app/notes/$noteId")({
  component: NotePage,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(personalNoteQueries.detail(params.noteId)),
});
