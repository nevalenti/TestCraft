import { getRouteApi, Outlet, useParams } from "@tanstack/react-router";

import { ProjectNotesSidebar } from "@/features/notes/sidebar/ProjectNotesSidebar";
import { NotesWorkspace } from "@/features/notes/workspace/NotesWorkspace";

const routeApi = getRouteApi("/_app/projects/$projectId/notes");

export const ProjectNotesLayout = () => {
  const { projectId } = routeApi.useParams();
  const activeNoteId = useParams({
    strict: false,
    select: (params) => params.noteId,
  });

  return (
    <NotesWorkspace
      hasActiveNote={!!activeNoteId}
      variant="card"
      fillHeight
      className="min-h-[34rem] basis-0"
      sidebar={
        <ProjectNotesSidebar
          projectId={projectId}
          activeNoteId={activeNoteId}
        />
      }
    >
      <Outlet />
    </NotesWorkspace>
  );
};
