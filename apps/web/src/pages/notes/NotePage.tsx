import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { queryKeys } from "@/api/queryKeys";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { DEFAULT_NOTE_TITLE } from "@/features/notes/constants";
import { NoteEditor } from "@/features/notes/editor/NoteEditor";
import {
  useDeletePersonalNote,
  useIsNoteSaveSettled,
  usePersonalNote,
  useUpdatePersonalNote,
} from "@/features/notes/hooks";
import { NoteBackLink } from "@/features/notes/NoteBackLink";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

const routeApi = getRouteApi("/_app/notes/$noteId");

export const NotePage = () => {
  const { noteId } = routeApi.useParams();
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const {
    data: note,
    isPending,
    isError,
    error,
    refetch,
  } = usePersonalNote(noteId);
  const updateNote = useUpdatePersonalNote();
  const deleteNote = useDeletePersonalNote();
  const isSaveSettled = useIsNoteSaveSettled(
    queryKeys.notes.personal.save(),
    noteId,
  );

  useBreadcrumbs([
    { label: "Notes", href: "/notes" },
    { label: note?.title ?? "…" },
  ]);

  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (isPending || !note || !isSaveSettled) return null;

  const handleDelete = () => {
    deleteNote.mutate(noteId, {
      onSuccess: () => navigate({ to: "/notes" }),
    });
  };

  return (
    <>
      <NoteEditor
        key={note.id}
        initialValue={{
          title: note.title,
          language: note.language,
          content: note.content,
        }}
        initialVersion={note.version}
        onSave={(value, version) =>
          updateNote.mutateAsync({
            id: note.id,
            version: version ?? note.version,
            ...value,
          })
        }
        isSaving={updateNote.isPending}
        updatedAt={note.updated_at}
        onDelete={() => setIsDeleteOpen(true)}
        leading={<NoteBackLink to="/notes" />}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Note"
        description={`Delete "${note.title || DEFAULT_NOTE_TITLE}"? This can't be undone.`}
        isLoading={deleteNote.isPending}
      />
    </>
  );
};
