import type { Note } from "@testcraft/types";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { personalNoteLink } from "@/features/notes/noteNavigation";
import { NotesSidebar } from "@/features/notes/sidebar/NotesSidebar";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  Link: ({
    children,
    to,
    params = {},
    className,
    "aria-current": ariaCurrent,
  }: {
    children?: React.ReactNode;
    to: string;
    params?: Record<string, string>;
    className?: string;
    "aria-current"?: "page";
  }) => (
    <a
      href={to.replaceAll(/\$(\w+)/g, (_, name: string) => params[name])}
      className={className}
      aria-current={ariaCurrent}
    >
      {children}
    </a>
  ),
}));

const today = new Date();
const lastYear = new Date(today.getFullYear() - 1, 0, 15);

const makeNote = (overrides: Partial<Note>): Note => ({
  id: "note",
  version: 1,
  title: "Note",
  language: "markdown",
  size_bytes: 10,
  excerpt: "",
  created_at: today.toISOString(),
  updated_at: today.toISOString(),
  ...overrides,
});

const NOTES = [
  makeNote({
    id: "old",
    title: "Archived ideas",
    excerpt: "from last year",
    updated_at: lastYear.toISOString(),
  }),
  makeNote({
    id: "deploy",
    title: "Deploy runbook",
    excerpt: "Run migrations first",
  }),
  makeNote({
    id: "query",
    title: "Slow query",
    language: "sql",
    excerpt: "select 1",
  }),
  makeNote({ id: "blank", title: "Blank", size_bytes: 0 }),
];

const renderSidebar = (
  props: Partial<React.ComponentProps<typeof NotesSidebar>> = {},
) => {
  const onSearchChange = vi.fn();
  render(
    <NotesSidebar
      notes={NOTES}
      isPending={false}
      isError={false}
      error={null}
      onRetry={vi.fn()}
      search=""
      activeSearch=""
      onSearchChange={onSearchChange}
      getNoteLink={personalNoteLink}
      scope="personal"
      {...props}
    />,
  );
  return { onSearchChange };
};

const titleOf = (link: HTMLElement) =>
  link.querySelector("[title]")?.textContent;

const noteTitles = () => {
  const list = screen.getByRole("navigation", { name: "Note list" });
  return within(list).getAllByRole("link").map(titleOf);
};

describe("NotesSidebar", () => {
  it("groups notes by recency, newest first, with excerpts and language tags", () => {
    renderSidebar({ activeNoteId: "deploy" });

    expect(
      screen.getByRole("heading", { name: "Today", level: 3 }),
    ).toBeInTheDocument();
    const lastYearLabel = String(lastYear.getFullYear());
    expect(
      screen.getByRole("heading", { name: lastYearLabel, level: 3 }),
    ).toBeInTheDocument();
    expect(noteTitles().at(-1)).toBe("Archived ideas");
    expect(screen.getByText("Run migrations first")).toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByText("Empty note")).toBeInTheDocument();
    expect(screen.getByLabelText("4 notes")).toHaveTextContent("4");
    expect(screen.getByRole("link", { current: "page" })).toHaveAttribute(
      "href",
      "/notes/deploy",
    );
  });

  it("highlights the searched text in titles", () => {
    renderSidebar({
      search: "runb",
      activeSearch: "runb",
      notes: [NOTES[1]],
    });

    expect(screen.getByText("runb", { selector: "mark" })).toBeInTheDocument();
  });

  it("offers to clear a search that matches nothing", async () => {
    const { onSearchChange } = renderSidebar({
      search: "zzz",
      activeSearch: "zzz",
      notes: [],
    });

    expect(screen.getByText("No notes match")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("invites creating the first note when there are none", async () => {
    const onCreate = vi.fn();
    renderSidebar({ notes: [], onCreate });

    expect(screen.getByText("No notes yet")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "New note" }));
    expect(onCreate).toHaveBeenCalled();
  });

  it("hides note creation for read-only viewers", () => {
    renderSidebar({ notes: [] });

    expect(
      screen.queryByRole("button", { name: "New note" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Nobody has written a note here yet."),
    ).toBeInTheDocument();
  });

  it('focuses search when "/" is pressed outside a text field', async () => {
    renderSidebar();

    await userEvent.keyboard("/");

    expect(
      screen.getByRole("searchbox", { name: "Search notes" }),
    ).toHaveFocus();
  });

  it("says who can see the notes", () => {
    renderSidebar();
    expect(
      screen.getByRole("heading", { name: /My notes/, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Only you can see these")).toBeInTheDocument();
  });

  it("labels project notes as shared", () => {
    renderSidebar({ scope: "project" });
    expect(
      screen.getByRole("heading", { name: /Project notes/, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Shared with project members")).toBeInTheDocument();
  });
});
