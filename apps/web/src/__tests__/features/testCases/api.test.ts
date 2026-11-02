import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listTestCasesByProject: vi.fn(),
  listTestCases: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { testCasesApi } from "@/features/testCases/api";
import { PAGE_SIZE } from "@/lib/constants";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("testCasesApi.getAllByProject", () => {
  it("fetches all project-wide cases, not scoped to a suite", async () => {
    vi.mocked(sdk.listTestCasesByProject).mockResolvedValue({
      data: { items: [] },
    } as never);

    await testCasesApi.getAllByProject("p1");

    expect(sdk.listTestCasesByProject).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { page: 1, page_size: PAGE_SIZE },
    });
  });
});

describe("testCasesApi.getAll", () => {
  it("scopes to the suite and omits search when not given", async () => {
    vi.mocked(sdk.listTestCases).mockResolvedValue({
      data: { items: [] },
    } as never);

    await testCasesApi.getAll("p1", "s1");

    expect(sdk.listTestCases).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1" },
      query: { page: 1, page_size: PAGE_SIZE },
    });
  });

  it("includes search when given", async () => {
    vi.mocked(sdk.listTestCases).mockResolvedValue({
      data: { items: [] },
    } as never);

    await testCasesApi.getAll("p1", "s1", "login");

    expect(sdk.listTestCases).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1" },
      query: { page: 1, page_size: PAGE_SIZE, search: "login" },
    });
  });
});
