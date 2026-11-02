import { useState } from "react";

import { usePersonalNotes } from "@/features/notes/hooks";
import {
  personalNoteLink,
  useOpenNewPersonalNote,
} from "@/features/notes/noteNavigation";
import { NotesSidebar } from "@/features/notes/sidebar/NotesSidebar";
import { useDebounce } from "@/hooks/useDebounce";

interface PersonalNotesSidebarProps {
  activeNoteId?: string;
}

export const PersonalNotesSidebar = ({
  activeNoteId,
}: PersonalNotesSidebarProps) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data, isPending, isError, error, refetch } = usePersonalNotes(
    debouncedSearch || undefined,
  );
  const { create, isCreating } = useOpenNewPersonalNote();

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
      getNoteLink={personalNoteLink}
      onCreate={create}
      isCreating={isCreating}
      scope="personal"
    />
  );
};
