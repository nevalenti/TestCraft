import { createContext, useContext } from "react";

export interface NotesWorkspaceControls {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const NotesWorkspaceContext =
  createContext<NotesWorkspaceControls | null>(null);

export const useNotesWorkspace = () => useContext(NotesWorkspaceContext);
