import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listTestPlans: vi.fn(),
  addCaseToPlan: vi.fn(),
  reorderPlanCases: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { testPlansApi } from "@/features/testPlans/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("testPlansApi", () => {
  it("getAll returns the plans of every page", async () => {
    vi.mocked(sdk.listTestPlans).mockResolvedValue({
      data: { items: [{ id: "x1" }], total: 1, page: 1, page_size: 500 },
    } as never);

    const result = await testPlansApi.getAll("p1");

    expect(result).toEqual([{ id: "x1" }]);
    expect(sdk.listTestPlans).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { page: 1, page_size: 500 },
    });
  });

  it("addCase posts the case id wrapped as testCaseId", () => {
    testPlansApi.addCase("p1", "pl1", "c1");

    expect(sdk.addCaseToPlan).toHaveBeenCalledWith({
      path: { project_id: "p1", plan_id: "pl1" },
      body: {
        test_case_id: "c1",
      },
    });
  });

  it("reorderCases puts the new ordering to the order sub-path", () => {
    const cases = [{ test_case_id: "c1", order: 0 }];

    testPlansApi.reorderCases("p1", "pl1", cases);

    expect(sdk.reorderPlanCases).toHaveBeenCalledWith({
      path: { project_id: "p1", plan_id: "pl1" },
      body: { cases },
    });
  });
});
