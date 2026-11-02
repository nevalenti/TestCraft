import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listTestRuns: vi.fn(),
  getTestRunLogs: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { testRunsApi } from "@/features/testRuns/api";
import { PAGE_SIZE } from "@/lib/constants";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("testRunsApi", () => {
  it("getAll omits search when not given", async () => {
    vi.mocked(sdk.listTestRuns).mockResolvedValue({
      data: { items: [] },
    } as never);

    await testRunsApi.getAll("p1");

    expect(sdk.listTestRuns).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { page: 1, page_size: PAGE_SIZE },
    });
  });

  it("getAll includes search when given", async () => {
    vi.mocked(sdk.listTestRuns).mockResolvedValue({
      data: { items: [] },
    } as never);

    await testRunsApi.getAll("p1", "nightly");

    expect(sdk.listTestRuns).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { page: 1, page_size: PAGE_SIZE, search: "nightly" },
    });
  });

  it("getActive fetches only active runs", async () => {
    vi.mocked(sdk.listTestRuns).mockResolvedValue({
      data: { items: [], total: 0, page: 1, page_size: PAGE_SIZE },
    } as never);

    await testRunsApi.getActive("p1");

    expect(sdk.listTestRuns).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { page: 1, page_size: PAGE_SIZE, status: "active" },
    });
  });

  it("getRecentlyCompleted fetches one page of the latest completed runs", async () => {
    vi.mocked(sdk.listTestRuns).mockResolvedValue({
      data: { items: [], total: 0, page: 1, page_size: 50 },
    } as never);

    await testRunsApi.getRecentlyCompleted("p1", 50);

    expect(sdk.listTestRuns).toHaveBeenCalledOnce();
    expect(sdk.listTestRuns).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: {
        page: 1,
        page_size: 50,
        status: "completed",
        sort_by: "updated_at",
      },
    });
  });

  it("getLogs fetches the newest page of the run's logs", async () => {
    vi.mocked(sdk.getTestRunLogs).mockResolvedValue({
      data: {
        items: [
          { seq: 4, message: "line 4" },
          { seq: 5, message: "line 5" },
        ],
        has_more: true,
      },
    } as never);

    const logs = await testRunsApi.getLogs("p1", "r1");

    expect(sdk.getTestRunLogs).toHaveBeenCalledWith({
      path: { project_id: "p1", run_id: "r1" },
    });
    expect(logs).toEqual({
      lines: ["line 4", "line 5"],
      earliestSeq: 4,
      latestSeq: 5,
      hasMore: true,
    });
  });

  it("getLogs pages backwards from beforeSeq", async () => {
    vi.mocked(sdk.getTestRunLogs).mockResolvedValue({
      data: { items: [], has_more: false },
    } as never);

    const logs = await testRunsApi.getLogs("p1", "r1", 4);

    expect(sdk.getTestRunLogs).toHaveBeenCalledWith({
      path: { project_id: "p1", run_id: "r1" },
      query: { before_seq: 4 },
    });
    expect(logs).toEqual({
      lines: [],
      earliestSeq: null,
      latestSeq: null,
      hasMore: false,
    });
  });
});
