import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { NotesWorkspace } from "@/features/notes/workspace/NotesWorkspace";
import { useNotesWorkspace } from "@/features/notes/workspace/notesWorkspaceContext";

const Toggle = () => {
  const workspace = useNotesWorkspace();
  if (!workspace) return <span>no controls</span>;

  return (
    <button type="button" onClick={workspace.toggleSidebar}>
      {workspace.isSidebarCollapsed ? "collapsed" : "expanded"}
    </button>
  );
};

const renderWorkspace = (hasActiveNote: boolean) =>
  render(
    <NotesWorkspace hasActiveNote={hasActiveNote} sidebar={<p>list</p>}>
      <Toggle />
    </NotesWorkspace>,
  );

describe("NotesWorkspace", () => {
  beforeEach(() => localStorage.clear());

  it("collapses the note list with Ctrl+B and remembers the choice", async () => {
    const { unmount } = renderWorkspace(true);
    expect(
      screen.getByRole("button", { name: "expanded" }),
    ).toBeInTheDocument();

    await userEvent.keyboard("{Control>}b{/Control}");

    expect(
      screen.getByRole("button", { name: "collapsed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "Notes" }),
    ).not.toHaveClass("md:flex");
    unmount();

    renderWorkspace(true);
    expect(
      screen.getByRole("button", { name: "collapsed" }),
    ).toBeInTheDocument();
  });

  it("keeps the list visible and offers no toggle without an open note", () => {
    localStorage.setItem("testcraft:notes:sidebar-collapsed", "true");
    renderWorkspace(false);

    expect(screen.getByText("no controls")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Notes" })).toHaveClass(
      "md:flex",
    );
  });
});
