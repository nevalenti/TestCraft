import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listTestSuites: vi.fn(),
  getTestSuite: vi.fn(),
  createTestSuite: vi.fn(),
  updateTestSuite: vi.fn(),
  deleteTestSuite: vi.fn(),
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

  it("getById fetches a single suite", async () => {
    vi.mocked(sdk.getTestSuite).mockResolvedValue({
      data: {},
    } as never);

    await testSuitesApi.getById("p1", "s1");

    expect(sdk.getTestSuite).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1" },
    });
  });

  it("create posts the new suite", async () => {
    vi.mocked(sdk.createTestSuite).mockResolvedValue({
      data: {},
    } as never);

    await testSuitesApi.create("p1", { name: "Auth" } as any);

    expect(sdk.createTestSuite).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      body: {
        name: "Auth",
      },
    });
  });

  it("update puts changes including the id", async () => {
    vi.mocked(sdk.updateTestSuite).mockResolvedValue({
      data: {},
    } as never);

    await testSuitesApi.update("p1", "s1", { name: "Renamed" } as any, 1);

    expect(sdk.updateTestSuite).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1" },
      body: {
        name: "Renamed",
      },
      headers: { "if-match": '"1"' },
    });
  });

  it("update sends the version it was based on as If-Match", async () => {
    vi.mocked(sdk.updateTestSuite).mockResolvedValue({
      data: {},
    } as never);

    await testSuitesApi.update("p1", "s1", { name: "Renamed" }, 7);

    expect(sdk.updateTestSuite).toHaveBeenCalledWith(
      expect.objectContaining({ headers: { "if-match": '"7"' } }),
    );
  });

  it("delete removes the suite by id", () => {
    testSuitesApi.delete("p1", "s1");

    expect(sdk.deleteTestSuite).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1" },
    });
  });
});
