import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  getRunTrend: vi.fn(),
  getSuiteBreakdown: vi.fn(),
  getFlakyTests: vi.fn(),
  getRunComparison: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { analyticsApi } from "@/features/analytics/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("analyticsApi", () => {
  it("getTrend defaults limit to 20 when not provided", async () => {
    vi.mocked(sdk.getRunTrend).mockResolvedValue({
      data: [],
    } as never);

    await analyticsApi.getTrend("p1");

    expect(sdk.getRunTrend).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { limit: 20 },
    });
  });

  it("getTrend passes an explicit limit through", async () => {
    vi.mocked(sdk.getRunTrend).mockResolvedValue({
      data: [],
    } as never);

    await analyticsApi.getTrend("p1", 50);

    expect(sdk.getRunTrend).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { limit: 50 },
    });
  });

  it("getSuiteBreakdown fetches breakdown for a specific run", async () => {
    vi.mocked(sdk.getSuiteBreakdown).mockResolvedValue({
      data: [],
    } as never);

    await analyticsApi.getSuiteBreakdown("p1", "r1");

    expect(sdk.getSuiteBreakdown).toHaveBeenCalledWith({
      path: { project_id: "p1", run_id: "r1" },
    });
  });

  it("getFlakyTests defaults minRuns to 3", async () => {
    vi.mocked(sdk.getFlakyTests).mockResolvedValue({
      data: [],
    } as never);

    await analyticsApi.getFlakyTests("p1");

    expect(sdk.getFlakyTests).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { min_runs: 3 },
    });
  });

  it("getRunComparison passes both run ids as query params", async () => {
    vi.mocked(sdk.getRunComparison).mockResolvedValue({
      data: {},
    } as never);

    await analyticsApi.getRunComparison("p1", "rA", "rB");

    expect(sdk.getRunComparison).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { run_a_id: "rA", run_b_id: "rB" },
    });
  });
});
