import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listProjects: vi.fn(),
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
});
