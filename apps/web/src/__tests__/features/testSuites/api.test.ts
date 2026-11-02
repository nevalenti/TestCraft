import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listTestSuites: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { testSuitesApi } from "@/features/testSuites/api";
import { PAGE_SIZE } from "@/lib/constants";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("testSuitesApi", () => {
  it("getAll omits search when not given", async () => {
    vi.mocked(sdk.listTestSuites).mockResolvedValue({
      data: { items: [] },
    } as never);

    await testSuitesApi.getAll("p1");

    expect(sdk.listTestSuites).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { page: 1, page_size: PAGE_SIZE },
    });
  });

  it("getAll includes search when given", async () => {
    vi.mocked(sdk.listTestSuites).mockResolvedValue({
      data: { items: [] },
    } as never);

    await testSuitesApi.getAll("p1", "auth");

    expect(sdk.listTestSuites).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { page: 1, page_size: PAGE_SIZE, search: "auth" },
    });
  });
});
