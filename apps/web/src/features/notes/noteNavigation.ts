import { linkOptions, useNavigate } from "@tanstack/react-router";
import type { Note } from "@testcraft/types";

import { DEFAULT_NOTE_TITLE } from "@/features/notes/constants";
import {
  useCreatePersonalNote,
  useCreateProjectNote,
} from "@/features/notes/hooks";

export const personalNoteLink = (note: Note) =>
  linkOptions({ to: "/notes/$noteId", params: { noteId: note.id } });

export const projectNoteLink = (projectId: string) => (note: Note) =>
  linkOptions({
    to: "/projects/$projectId/notes/$noteId",
    params: { projectId, noteId: note.id },
  });

export const useOpenNewPersonalNote = () => {
  const navigate = useNavigate();
  const createNote = useCreatePersonalNote();

  return {
    create: () =>
      createNote.mutate(
        { title: DEFAULT_NOTE_TITLE },
        {
          onSuccess: (note) =>
            navigate({ to: "/notes/$noteId", params: { noteId: note.id } }),
        },
      ),
    isCreating: createNote.isPending,
  };
};

export const useOpenNewProjectNote = (projectId: string) => {
  const navigate = useNavigate();
  const createNote = useCreateProjectNote(projectId);

  return {
    create: () =>
      createNote.mutate(
        { title: DEFAULT_NOTE_TITLE },
        {
          onSuccess: (note) =>
            navigate({
              to: "/projects/$projectId/notes/$noteId",
              params: { projectId, noteId: note.id },
            }),
        },
      ),
    isCreating: createNote.isPending,
  };
};
