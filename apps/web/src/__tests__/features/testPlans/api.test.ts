import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listTestPlans: vi.fn(),
  getTestPlan: vi.fn(),
  getTestPlanCases: vi.fn(),
  createTestPlan: vi.fn(),
  updateTestPlan: vi.fn(),
  deleteTestPlan: vi.fn(),
  addCaseToPlan: vi.fn(),
  removeCaseFromPlan: vi.fn(),
  reorderPlanCases: vi.fn(),
  createRunFromPlan: vi.fn(),
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

  it("getById fetches a single plan", async () => {
    vi.mocked(sdk.getTestPlan).mockResolvedValue({
      data: {},
    } as never);

    await testPlansApi.getById("p1", "pl1");

    expect(sdk.getTestPlan).toHaveBeenCalledWith({
      path: { project_id: "p1", plan_id: "pl1" },
    });
  });

  it("getCases fetches the plan's cases sub-resource", async () => {
    vi.mocked(sdk.getTestPlanCases).mockResolvedValue({
      data: [],
    } as never);

    await testPlansApi.getCases("p1", "pl1");

    expect(sdk.getTestPlanCases).toHaveBeenCalledWith({
      path: { project_id: "p1", plan_id: "pl1" },
    });
  });

  it("create posts the new plan", async () => {
    vi.mocked(sdk.createTestPlan).mockResolvedValue({
      data: {},
    } as never);

    await testPlansApi.create("p1", { name: "Regression" } as any);

    expect(sdk.createTestPlan).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      body: {
        name: "Regression",
      },
    });
  });

  it("update puts the plan changes", async () => {
    vi.mocked(sdk.updateTestPlan).mockResolvedValue({
      data: {},
    } as never);

    await testPlansApi.update("p1", "pl1", { name: "Renamed" } as any, 1);

    expect(sdk.updateTestPlan).toHaveBeenCalledWith({
      path: { project_id: "p1", plan_id: "pl1" },
      body: { name: "Renamed" },
      headers: { "if-match": '"1"' },
    });
  });

  it("delete removes the plan by id", () => {
    testPlansApi.delete("p1", "pl1");

    expect(sdk.deleteTestPlan).toHaveBeenCalledWith({
      path: { project_id: "p1", plan_id: "pl1" },
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

  it("removeCase deletes the case from the plan", () => {
    testPlansApi.removeCase("p1", "pl1", "c1");

    expect(sdk.removeCaseFromPlan).toHaveBeenCalledWith({
      path: { project_id: "p1", plan_id: "pl1", case_id: "c1" },
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

  it("createRun posts to the plan's run endpoint", async () => {
    vi.mocked(sdk.createRunFromPlan).mockResolvedValue({
      data: { id: "r1" },
    } as never);

    await testPlansApi.createRun("p1", "pl1", {
      name: "Nightly",
      environment: "ci",
    });

    expect(sdk.createRunFromPlan).toHaveBeenCalledWith({
      path: { project_id: "p1", plan_id: "pl1" },
      body: {
        name: "Nightly",
        environment: "ci",
      },
    });
  });
});
