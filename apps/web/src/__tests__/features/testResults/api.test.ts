import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listTestResults: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { RESULTS_PAGE_SIZE, testResultsApi } from "@/features/testResults/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("testResultsApi.getAll", () => {
  it("defaults page to 1 and pageSize to RESULTS_PAGE_SIZE, omitting status/search", async () => {
    vi.mocked(sdk.listTestResults).mockResolvedValue({
      data: { items: [] },
    } as never);

    await testResultsApi.getAll("p1", "r1");

    expect(sdk.listTestResults).toHaveBeenCalledWith({
      path: { project_id: "p1", run_id: "r1" },
      query: { page: 1, page_size: RESULTS_PAGE_SIZE },
    });
  });

  it("includes status and search and a custom page/pageSize when given", async () => {
    vi.mocked(sdk.listTestResults).mockResolvedValue({
      data: { items: [] },
    } as never);

    await testResultsApi.getAll("p1", "r1", "failed", "login", 2, 10);

    expect(sdk.listTestResults).toHaveBeenCalledWith({
      path: { project_id: "p1", run_id: "r1" },
      query: {
        page: 2,
        page_size: 10,
        status: "failed",
        search: "login",
      },
    });
  });

  it("sends sort field and direction to the API", async () => {
    vi.mocked(sdk.listTestResults).mockResolvedValue({
      data: { items: [] },
    } as never);

    await testResultsApi.getAll(
      "p1",
      "r1",
      undefined,
      undefined,
      2,
      15,
      "duration_ms",
      "desc",
    );

    expect(sdk.listTestResults).toHaveBeenCalledWith({
      path: { project_id: "p1", run_id: "r1" },
      query: {
        page: 2,
        page_size: 15,
        sort_by: "duration_ms",
        sort_dir: "desc",
      },
    });
  });
});
