import { getRouteApi } from "@tanstack/react-router";

import { useProjectNotes } from "@/features/notes/hooks";
import {
  projectNoteLink,
  useOpenNewProjectNote,
} from "@/features/notes/noteNavigation";
import { NotesIndexPane } from "@/features/notes/sidebar/NotesIndexPane";
import { useProjectPermissions } from "@/features/projects/permissions";

const routeApi = getRouteApi("/_app/projects/$projectId/notes/");

export const ProjectNotesIndexPage = () => {
  const { projectId } = routeApi.useParams();
  const { canEdit } = useProjectPermissions(projectId);
  const { data: notes } = useProjectNotes(projectId);
  const { create, isCreating } = useOpenNewProjectNote(projectId);

  return (
    <NotesIndexPane
      notes={notes}
      getNoteLink={projectNoteLink(projectId)}
      onCreate={canEdit ? create : undefined}
      isCreating={isCreating}
    />
  );
};
