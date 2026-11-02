import { useState } from "react";

import { useProjectNotes } from "@/features/notes/hooks";
import {
  projectNoteLink,
  useOpenNewProjectNote,
} from "@/features/notes/noteNavigation";
import { NotesSidebar } from "@/features/notes/sidebar/NotesSidebar";
import { useProjectPermissions } from "@/features/projects/permissions";
import { useDebounce } from "@/hooks/useDebounce";

interface ProjectNotesSidebarProps {
  projectId: string;
  activeNoteId?: string;
}

export const ProjectNotesSidebar = ({
  projectId,
  activeNoteId,
}: ProjectNotesSidebarProps) => {
  const { canEdit } = useProjectPermissions(projectId);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data, isPending, isError, error, refetch } = useProjectNotes(
    projectId,
    debouncedSearch || undefined,
  );
  const { create, isCreating } = useOpenNewProjectNote(projectId);

  return (
    <NotesSidebar
      notes={data}
      isPending={isPending}
      isError={isError}
      error={error}
      onRetry={refetch}
      search={search}
      activeSearch={debouncedSearch}
      onSearchChange={setSearch}
      activeNoteId={activeNoteId}
      getNoteLink={projectNoteLink(projectId)}
      onCreate={canEdit ? create : undefined}
      isCreating={isCreating}
      scope="project"
    />
  );
};
