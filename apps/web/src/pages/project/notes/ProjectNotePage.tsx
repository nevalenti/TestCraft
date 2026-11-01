import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { queryKeys } from "@/api/queryKeys";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { DEFAULT_NOTE_TITLE } from "@/features/notes/constants";
import { NoteEditor } from "@/features/notes/editor/NoteEditor";
import {
  useDeleteProjectNote,
  useIsNoteSaveSettled,
  useProjectNote,
  useUpdateProjectNote,
} from "@/features/notes/hooks";
import { NoteBackLink } from "@/features/notes/NoteBackLink";
import { useProject } from "@/features/projects/hooks";
import { useProjectPermissions } from "@/features/projects/permissions";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

const routeApi = getRouteApi("/_app/projects/$projectId/notes/$noteId");

export const ProjectNotePage = () => {
  const { projectId, noteId } = routeApi.useParams();
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { canEdit } = useProjectPermissions(projectId);
  const {
    data: note,
    isPending,
    isError,
    error,
    refetch,
  } = useProjectNote(projectId, noteId);
  const updateNote = useUpdateProjectNote(projectId);
  const deleteNote = useDeleteProjectNote(projectId);
  const isSaveSettled = useIsNoteSaveSettled(
    queryKeys.notes.project.save(projectId),
    noteId,
  );
  const notesHref = `/projects/${projectId}/notes`;
  const { data: project } = useProject(projectId);

  useBreadcrumbs(
    [
      { label: "Projects", href: "/projects" },
      { label: project?.name ?? "…", href: `/projects/${projectId}` },
      { label: "Notes", href: notesHref },
      { label: note?.title || DEFAULT_NOTE_TITLE },
    ],
    1,
  );

  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (isPending || !note || !isSaveSettled) return null;

  const handleDelete = () => {
    deleteNote.mutate(noteId, {
      onSuccess: () =>
        navigate({ to: "/projects/$projectId/notes", params: { projectId } }),
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
        readOnly={!canEdit}
        updatedAt={note.updated_at}
        onDelete={canEdit ? () => setIsDeleteOpen(true) : undefined}
        leading={
          <NoteBackLink
            to="/projects/$projectId/notes"
            params={{ projectId }}
          />
        }
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
