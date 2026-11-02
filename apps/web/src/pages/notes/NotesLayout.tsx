import { Outlet, useParams } from "@tanstack/react-router";

import { PersonalNotesSidebar } from "@/features/notes/sidebar/PersonalNotesSidebar";
import { NotesWorkspace } from "@/features/notes/workspace/NotesWorkspace";

export const NotesLayout = () => {
  const activeNoteId = useParams({
    strict: false,
    select: (params) => params.noteId,
  });

  return (
    <div className="flex min-h-0 w-full flex-col">
      <NotesWorkspace
        hasActiveNote={!!activeNoteId}
        sidebar={<PersonalNotesSidebar activeNoteId={activeNoteId} />}
      >
        <Outlet />
      </NotesWorkspace>
    </div>
  );
};
