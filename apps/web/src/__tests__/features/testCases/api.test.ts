import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listTestCasesByProject: vi.fn(),
  listTestCases: vi.fn(),
  getTestCase: vi.fn(),
  createTestCase: vi.fn(),
  updateTestCase: vi.fn(),
  deleteTestCase: vi.fn(),
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

describe("testCasesApi other operations", () => {
  it("getById fetches a single case scoped to the suite", async () => {
    vi.mocked(sdk.getTestCase).mockResolvedValue({
      data: {},
    } as never);

    await testCasesApi.getById("p1", "s1", "c1");

    expect(sdk.getTestCase).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1", case_id: "c1" },
    });
  });

  it("create posts the new case scoped to the suite", async () => {
    vi.mocked(sdk.createTestCase).mockResolvedValue({
      data: {},
    } as never);

    await testCasesApi.create("p1", "s1", { title: "Login works" } as any);

    expect(sdk.createTestCase).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1" },
      body: {
        title: "Login works",
      },
    });
  });

  it("update puts changes including the id", async () => {
    vi.mocked(sdk.updateTestCase).mockResolvedValue({
      data: {},
    } as never);

    await testCasesApi.update(
      "p1",
      "s1",
      "c1",
      {
        title: "Renamed",
      } as any,
      1,
    );

    expect(sdk.updateTestCase).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1", case_id: "c1" },
      body: {
        title: "Renamed",
      },
      headers: { "if-match": '"1"' },
    });
  });

  it("delete removes the case by id", () => {
    testCasesApi.delete("p1", "s1", "c1");

    expect(sdk.deleteTestCase).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1", case_id: "c1" },
    });
  });
});
