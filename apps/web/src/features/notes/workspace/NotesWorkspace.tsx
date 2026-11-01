import { type ReactNode, useCallback, useEffect, useState } from "react";

import { NotesWorkspaceContext } from "@/features/notes/workspace/notesWorkspaceContext";
import { cn } from "@/lib/cn";
import { readStorage, writeStorage } from "@/lib/storage";

const COLLAPSED_KEY = "testcraft:notes:sidebar-collapsed";

const isCollapsedStored = () => readStorage(COLLAPSED_KEY) === "true";

interface NotesWorkspaceProps {
  sidebar: ReactNode;
  children: ReactNode;
  hasActiveNote: boolean;
  variant?: "flush" | "card";
  fillHeight?: boolean;
  className?: string;
}

export const NotesWorkspace = ({
  sidebar,
  children,
  hasActiveNote,
  variant = "flush",
  fillHeight,
  className,
}: NotesWorkspaceProps) => {
  const [isCollapsedPreference, setIsCollapsedPreference] =
    useState(isCollapsedStored);
  const isSidebarCollapsed = hasActiveNote && isCollapsedPreference;

  const toggleSidebar = useCallback(() => {
    setIsCollapsedPreference((previous) => {
      writeStorage(COLLAPSED_KEY, String(!previous));
      return !previous;
    });
  }, []);

  useEffect(() => {
    if (!hasActiveNote) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "b")
        return;
      event.preventDefault();
      toggleSidebar();
    };
    addEventListener("keydown", handleKeyDown);
    return () => removeEventListener("keydown", handleKeyDown);
  }, [hasActiveNote, toggleSidebar]);

  return (
    <NotesWorkspaceContext.Provider
      value={hasActiveNote ? { isSidebarCollapsed, toggleSidebar } : null}
    >
      <div
        data-fill-height={fillHeight || undefined}
        className={cn(
          "flex min-h-0 flex-1 overflow-hidden md:grid md:grid-rows-[minmax(0,1fr)]",
          isSidebarCollapsed
            ? "md:grid-cols-[minmax(0,1fr)]"
            : "md:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]",
          variant === "card"
            ? "panel [--notes-list-bg:color-mix(in_oklab,var(--color-base-200)_40%,var(--color-base-100))]"
            : "[--notes-list-bg:color-mix(in_oklab,var(--color-base-200)_40%,var(--color-base-300))]",
          className,
        )}
      >
        <aside
          aria-label="Notes"
          className={cn(
            "min-h-0 min-w-0 flex-1 flex-col bg-(--notes-list-bg) md:border-r md:border-border",
            hasActiveNote ? "hidden" : "flex",
            !isSidebarCollapsed && "md:flex",
          )}
        >
          {sidebar}
        </aside>
        <section
          className={cn(
            "min-h-0 min-w-0 flex-1 flex-col md:flex",
            hasActiveNote ? "flex" : "hidden",
          )}
        >
          {children}
        </section>
      </div>
    </NotesWorkspaceContext.Provider>
  );
};
