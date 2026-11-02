import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listPersonalNotes: vi.fn(),
  listProjectNotes: vi.fn(),
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
});
