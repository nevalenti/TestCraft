import { usePersonalNotes } from "@/features/notes/hooks";
import {
  personalNoteLink,
  useOpenNewPersonalNote,
} from "@/features/notes/noteNavigation";
import { NotesIndexPane } from "@/features/notes/sidebar/NotesIndexPane";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

export const NotesIndexPage = () => {
  useBreadcrumbs([{ label: "Notes" }]);
  const { data: notes } = usePersonalNotes();
  const { create, isCreating } = useOpenNewPersonalNote();

  return (
    <NotesIndexPane
      notes={notes}
      getNoteLink={personalNoteLink}
      onCreate={create}
      isCreating={isCreating}
    />
  );
};
