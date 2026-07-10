import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import client from "@/api/client";
import { projectsApi } from "@/api/projects";
import { PAGE_SIZE } from "@/lib/constants";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("projectsApi", () => {
  it("getAll omits the search param when none is given", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    await projectsApi.getAll();

    expect(client.get).toHaveBeenCalledWith("projects", {
      params: { pageSize: PAGE_SIZE },
    });
  });

  it("getAll includes the search param when given", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    await projectsApi.getAll("alpha");

    expect(client.get).toHaveBeenCalledWith("projects", {
      params: { pageSize: PAGE_SIZE, search: "alpha" },
    });
  });

  it("getById fetches a single project", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { id: "p1" } });

    await projectsApi.getById("p1");

    expect(client.get).toHaveBeenCalledWith("projects/p1");
  });

  it("create posts the new project", async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: "p1" } });

    await projectsApi.create({ name: "New" } as any);

    expect(client.post).toHaveBeenCalledWith("projects", { name: "New" });
  });

  it("update puts the changes including the id", async () => {
    vi.mocked(client.put).mockResolvedValue({ data: { id: "p1" } });

    await projectsApi.update("p1", { name: "Renamed" } as any);

    expect(client.put).toHaveBeenCalledWith("projects/p1", {
      name: "Renamed",
      id: "p1",
    });
  });

  it("delete removes the project by id", () => {
    projectsApi.delete("p1");

    expect(client.delete).toHaveBeenCalledWith("projects/p1");
  });
});
