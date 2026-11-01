import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { projectsApi } from "@/features/projects/api";
import { PAGE_SIZE } from "@/lib/constants";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("projectsApi", () => {
  it("getAll omits the search param when none is given", async () => {
    vi.mocked(sdk.listProjects).mockResolvedValue({
      data: { items: [] },
    } as never);

    await projectsApi.getAll();

    expect(sdk.listProjects).toHaveBeenCalledWith({
      query: { page: 1, page_size: PAGE_SIZE },
    });
  });

  it("getAll includes the search param when given", async () => {
    vi.mocked(sdk.listProjects).mockResolvedValue({
      data: { items: [] },
    } as never);

    await projectsApi.getAll("alpha");

    expect(sdk.listProjects).toHaveBeenCalledWith({
      query: { page: 1, page_size: PAGE_SIZE, search: "alpha" },
    });
  });

  it("getById fetches a single project", async () => {
    vi.mocked(sdk.getProject).mockResolvedValue({
      data: { id: "p1" },
    } as never);

    await projectsApi.getById("p1");

    expect(sdk.getProject).toHaveBeenCalledWith({
      path: { project_id: "p1" },
    });
  });

  it("create posts the new project", async () => {
    vi.mocked(sdk.createProject).mockResolvedValue({
      data: { id: "p1" },
    } as never);

    await projectsApi.create({ name: "New" } as any);

    expect(sdk.createProject).toHaveBeenCalledWith({
      body: { name: "New" },
    });
  });

  it("update puts the changes including the id", async () => {
    vi.mocked(sdk.updateProject).mockResolvedValue({
      data: { id: "p1" },
    } as never);

    await projectsApi.update("p1", { name: "Renamed" } as any, 1);

    expect(sdk.updateProject).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      body: {
        name: "Renamed",
      },
      headers: { "if-match": '"1"' },
    });
  });

  it("delete removes the project by id", () => {
    projectsApi.delete("p1");

    expect(sdk.deleteProject).toHaveBeenCalledWith({
      path: { project_id: "p1" },
    });
  });
});
