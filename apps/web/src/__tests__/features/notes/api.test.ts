import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listPersonalNotes: vi.fn(),
  getPersonalNote: vi.fn(),
  createPersonalNote: vi.fn(),
  updatePersonalNote: vi.fn(),
  deletePersonalNote: vi.fn(),
  listProjectNotes: vi.fn(),
  createProjectNote: vi.fn(),
  deleteProjectNote: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { personalNotesApi, projectNotesApi } from "@/features/notes/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("personalNotesApi", () => {
  it("getAll fetches the current user notes", async () => {
    vi.mocked(sdk.listPersonalNotes).mockResolvedValue({
      data: { items: [] },
    } as never);

    await personalNotesApi.getAll();

    expect(sdk.listPersonalNotes).toHaveBeenCalledWith({
      query: { page: 1, page_size: expect.any(Number) },
    });
  });

  it("getAll includes a search param when given", async () => {
    vi.mocked(sdk.listPersonalNotes).mockResolvedValue({
      data: { items: [] },
    } as never);

    await personalNotesApi.getAll("todo");

    expect(sdk.listPersonalNotes).toHaveBeenCalledWith({
      query: { page: 1, page_size: expect.any(Number), search: "todo" },
    });
  });

  it("getById fetches a single note", async () => {
    vi.mocked(sdk.getPersonalNote).mockResolvedValue({
      data: {},
    } as never);

    await personalNotesApi.getById("n1");

    expect(sdk.getPersonalNote).toHaveBeenCalledWith({
      path: { note_id: "n1" },
    });
  });

  it("create posts the new note payload", async () => {
    vi.mocked(sdk.createPersonalNote).mockResolvedValue({
      data: { id: "n1" },
    } as never);

    await personalNotesApi.create({ title: "My Note" });

    expect(sdk.createPersonalNote).toHaveBeenCalledWith({
      body: { title: "My Note" },
    });
  });

  it("update puts the changed note payload", async () => {
    vi.mocked(sdk.updatePersonalNote).mockResolvedValue({
      data: {},
    } as never);

    await personalNotesApi.update(
      "n1",
      {
        title: "New",
        language: "json",
        content: "{}",
      },
      1,
    );

    expect(sdk.updatePersonalNote).toHaveBeenCalledWith({
      path: { note_id: "n1" },
      body: {
        title: "New",
        language: "json",
        content: "{}",
      },
      headers: { "if-match": '"1"' },
    });
  });

  it("delete removes the note by id", () => {
    personalNotesApi.delete("n1");

    expect(sdk.deletePersonalNote).toHaveBeenCalledWith({
      path: { note_id: "n1" },
    });
  });
});

describe("projectNotesApi", () => {
  it("getAll fetches notes for the project", async () => {
    vi.mocked(sdk.listProjectNotes).mockResolvedValue({
      data: { items: [] },
    } as never);

    await projectNotesApi.getAll("p1");

    expect(sdk.listProjectNotes).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { page: 1, page_size: expect.any(Number) },
    });
  });

  it("create posts the new note payload to the project", async () => {
    vi.mocked(sdk.createProjectNote).mockResolvedValue({
      data: { id: "n1" },
    } as never);

    await projectNotesApi.create("p1", { title: "Runbook" });

    expect(sdk.createProjectNote).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      body: {
        title: "Runbook",
      },
    });
  });

  it("delete removes the note from the project", () => {
    projectNotesApi.delete("p1", "n1");

    expect(sdk.deleteProjectNote).toHaveBeenCalledWith({
      path: { project_id: "p1", note_id: "n1" },
    });
  });
});
