import {
  keepPreviousData,
  type MutationKey,
  type QueryClient,
  type QueryKey,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CreatePersonalNote,
  CreateProjectNote,
  Note,
  NoteDetail,
  Paginated,
  UpdatePersonalNote,
  UpdateProjectNote,
} from "@testcraft/types";
import { useState } from "react";

import { queryKeys } from "@/api/queryKeys";
import {
  personalNoteQueries,
  personalNotesApi,
  projectNoteQueries,
  projectNotesApi,
} from "@/features/notes/api";
import { notify } from "@/lib/notify";

const storeSavedNote = (
  queryClient: QueryClient,
  detailKey: QueryKey,
  listsKey: QueryKey,
  note: Note,
  input: UpdatePersonalNote,
) => {
  queryClient.setQueryData<NoteDetail>(detailKey, (previous) => ({
    ...previous,
    ...input,
    ...note,
  }));
  queryClient.setQueriesData<Paginated<Note>>(
    { queryKey: listsKey },
    (page) =>
      page && {
        ...page,
        items: page.items.map((item) => (item.id === note.id ? note : item)),
      },
  );
  queryClient.invalidateQueries({ queryKey: listsKey, refetchType: "none" });
};

export const usePersonalNotes = (search?: string) =>
  useQuery({
    ...personalNoteQueries.all(search),
    select: (data) => data.items,
    placeholderData: keepPreviousData,
  });

export const usePersonalNote = (id: string) =>
  useQuery(personalNoteQueries.detail(id));

export const useCreatePersonalNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePersonalNote) => personalNotesApi.create(input),
    onSuccess: (note, input) => {
      queryClient.setQueryData<NoteDetail>(
        queryKeys.notes.personal.detail(note.id),
        { ...note, content: input.content ?? "" },
      );
      notify("Note created");
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.personal.all(),
      });
    },
  });
};

export const useUpdatePersonalNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.notes.personal.save(),
    mutationFn: ({
      id,
      version,
      ...input
    }: UpdatePersonalNote & {
      id: string;
      version: number;
    }) => personalNotesApi.update(id, input, version),
    onSuccess: (note, input) => {
      storeSavedNote(
        queryClient,
        queryKeys.notes.personal.detail(note.id),
        queryKeys.notes.personal.lists(),
        note,
        input,
      );
    },
  });
};

export const useDeletePersonalNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => personalNotesApi.delete(id),
    onSuccess: (_, id) => {
      notify("Note deleted");
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.personal.all(),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.notes.personal.detail(id),
      });
    },
  });
};

export const useProjectNotes = (projectId: string, search?: string) =>
  useQuery({
    ...projectNoteQueries.all(projectId, search),
    select: (data) => data.items,
    placeholderData: keepPreviousData,
  });

export const useProjectNote = (projectId: string, id: string) =>
  useQuery(projectNoteQueries.detail(projectId, id));

export const useCreateProjectNote = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectNote) =>
      projectNotesApi.create(projectId, input),
    onSuccess: (note, input) => {
      queryClient.setQueryData<NoteDetail>(
        queryKeys.notes.project.detail(projectId, note.id),
        { ...note, content: input.content ?? "" },
      );
      notify("Note created");
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.project.all(projectId),
      });
    },
  });
};

export const useUpdateProjectNote = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.notes.project.save(projectId),
    mutationFn: ({
      id,
      version,
      ...input
    }: UpdateProjectNote & {
      id: string;
      version: number;
    }) => projectNotesApi.update(projectId, id, input, version),
    onSuccess: (note, input) => {
      storeSavedNote(
        queryClient,
        queryKeys.notes.project.detail(projectId, note.id),
        queryKeys.notes.project.lists(projectId),
        note,
        input,
      );
    },
  });
};

export const useDeleteProjectNote = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectNotesApi.delete(projectId, id),
    onSuccess: (_, id) => {
      notify("Note deleted");
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.project.all(projectId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.notes.project.detail(projectId, id),
      });
    },
  });
};

export const useIsNoteSaveSettled = (
  mutationKey: MutationKey,
  noteId: string,
) => {
  const isSaving =
    useIsMutating({
      mutationKey,
      predicate: (mutation) =>
        (mutation.state.variables as { id?: string } | undefined)?.id ===
        noteId,
    }) > 0;
  const [settledNoteId, setSettledNoteId] = useState(isSaving ? null : noteId);

  if (settledNoteId !== noteId && !isSaving) setSettledNoteId(noteId);

  return settledNoteId === noteId;
};
