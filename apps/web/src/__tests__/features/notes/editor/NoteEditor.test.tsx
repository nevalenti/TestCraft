import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NoteEditor } from "@/features/notes/editor/NoteEditor";

vi.mock("@/lib/monacoEnvironment", () => ({}));

vi.mock("@monaco-editor/react", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string | undefined) => void;
  }) => (
    <textarea
      aria-label="content"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

describe("NoteEditor", () => {
  describe("given initial values — renders them", () => {
    it("shows the title and language", () => {
      render(
        <NoteEditor
          initialValue={{
            title: "My Note",
            language: "markdown",
            content: "Hi",
          }}
          onSave={vi.fn()}
        />,
      );

      expect(screen.getByLabelText("Note title")).toHaveValue("My Note");
      expect(screen.getByLabelText("Note language")).toHaveValue("markdown");
    });
  });

  describe("given the user edits the title — debounces and calls onSave", () => {
    it("calls onSave with the updated title after the debounce delay", async () => {
      const onSave = vi.fn();
      render(
        <NoteEditor
          initialValue={{ title: "Old", language: "markdown", content: "" }}
          onSave={onSave}
        />,
      );

      await userEvent.clear(screen.getByLabelText("Note title"));
      await userEvent.type(screen.getByLabelText("Note title"), "New");

      await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith(
          {
            title: "New",
            language: "markdown",
            content: "",
          },
          undefined,
        ),
      );
    });
  });

  describe("given no change from the initial value — does not call onSave", () => {
    it("never invokes onSave", async () => {
      const onSave = vi.fn();
      render(
        <NoteEditor
          initialValue={{ title: "Same", language: "markdown", content: "" }}
          onSave={onSave}
        />,
      );

      await act(() => new Promise((resolve) => setTimeout(resolve, 900)));

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("given an empty title — does not call onSave", () => {
    it("skips saving a blank title", async () => {
      const onSave = vi.fn();
      render(
        <NoteEditor
          initialValue={{ title: "Old", language: "markdown", content: "" }}
          onSave={onSave}
        />,
      );

      await userEvent.clear(screen.getByLabelText("Note title"));
      await act(() => new Promise((resolve) => setTimeout(resolve, 900)));

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("given isSaving — shows a saving indicator", () => {
    it("renders the saving label", () => {
      render(
        <NoteEditor
          initialValue={{ title: "Note", language: "markdown", content: "" }}
          onSave={vi.fn()}
          isSaving
        />,
      );

      expect(screen.getByText("Saving…")).toBeInTheDocument();
    });
  });

  it("shows a failed save and retries the same value", async () => {
    const onSave = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    render(
      <NoteEditor
        initialValue={{ title: "Old", language: "markdown", content: "" }}
        onSave={onSave}
      />,
    );

    await userEvent.clear(screen.getByLabelText("Note title"));
    await userEvent.type(screen.getByLabelText("Note title"), "New");
    await waitFor(
      () => expect(screen.getByText("Save failed. Retry")).toBeInTheDocument(),
      { timeout: 2000 },
    );
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Save failed. Retry"));
    await waitFor(() => expect(screen.getByText("Saved")).toBeInTheDocument());
    expect(onSave).toHaveBeenCalledTimes(2);
  });
});

it("flushes edits to the previous note when switching keyed documents", async () => {
  const saveFirst = vi.fn().mockResolvedValue(undefined);
  const saveSecond = vi.fn().mockResolvedValue(undefined);
  const { rerender } = render(
    <NoteEditor
      key="first"
      initialValue={{ title: "First", language: "markdown", content: "" }}
      onSave={saveFirst}
    />,
  );
  await userEvent.clear(screen.getByLabelText("Note title"));
  await userEvent.type(screen.getByLabelText("Note title"), "Edited first");
  rerender(
    <NoteEditor
      key="second"
      initialValue={{ title: "Second", language: "markdown", content: "" }}
      onSave={saveSecond}
    />,
  );
  expect(screen.getByLabelText("Note title")).toHaveValue("Second");
  expect(saveFirst).toHaveBeenCalledWith(
    {
      title: "Edited first",
      language: "markdown",
      content: "",
    },
    undefined,
  );
  expect(saveSecond).not.toHaveBeenCalled();
});

describe("NoteEditor view modes and actions", () => {
  it("renders a markdown preview when switching to Preview", async () => {
    render(
      <NoteEditor
        initialValue={{
          title: "Doc",
          language: "markdown",
          content: "# Heading\n\n- [x] done",
        }}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("content")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Preview" }));

    expect(
      await screen.findByRole("heading", { name: "Heading", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.queryByLabelText("content")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("opens read-only markdown notes in preview", async () => {
    render(
      <NoteEditor
        initialValue={{ title: "Doc", language: "markdown", content: "Hello" }}
        onSave={vi.fn()}
        readOnly
      />,
    );

    expect(await screen.findByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("View only")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Source" })).toBeInTheDocument();
    expect(screen.queryByText("Delete note")).not.toBeInTheDocument();
  });

  it("hides the view toggle for code notes", () => {
    render(
      <NoteEditor
        initialValue={{ title: "SQL", language: "sql", content: "select 1" }}
        onSave={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("group", { name: "View mode" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/1 lines · 2 words · 8 chars/)).toBeInTheDocument();
  });

  it("deletes from the actions menu", async () => {
    const onDelete = vi.fn();
    render(
      <NoteEditor
        initialValue={{ title: "Doc", language: "markdown", content: "" }}
        onSave={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Note actions" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete note" }));

    expect(onDelete).toHaveBeenCalled();
  });

  it("selects the placeholder title of a brand-new note", () => {
    render(
      <NoteEditor
        initialValue={{
          title: "Untitled note",
          language: "markdown",
          content: "",
        }}
        onSave={vi.fn()}
      />,
    );

    const title = screen.getByLabelText<HTMLInputElement>("Note title");
    expect(title).toHaveFocus();
    expect(title.selectionStart).toBe(0);
    expect(title.selectionEnd).toBe("Untitled note".length);
  });
});
