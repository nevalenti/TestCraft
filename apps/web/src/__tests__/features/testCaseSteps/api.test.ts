import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listTestCaseSteps: vi.fn(),
  createTestCaseStep: vi.fn(),
  updateTestCaseStep: vi.fn(),
  reorderTestCaseSteps: vi.fn(),
  deleteTestCaseStep: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { testCaseStepsApi } from "@/features/testCaseSteps/api";
import { PAGE_SIZE } from "@/lib/constants";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("testCaseStepsApi", () => {
  it("getAll fetches the page of steps for the case", async () => {
    vi.mocked(sdk.listTestCaseSteps).mockResolvedValue({
      data: { items: [] },
    } as never);

    await testCaseStepsApi.getAll("p1", "s1", "c1");

    expect(sdk.listTestCaseSteps).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1", case_id: "c1" },
      query: { page: 1, page_size: PAGE_SIZE },
    });
  });

  it("create posts the new step", async () => {
    vi.mocked(sdk.createTestCaseStep).mockResolvedValue({
      data: { id: "st1" },
    } as never);

    await testCaseStepsApi.create("p1", "s1", "c1", {
      action: "Click login",
    } as any);

    expect(sdk.createTestCaseStep).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1", case_id: "c1" },
      body: { action: "Click login" },
    });
  });

  it("update puts the step changes including the id", async () => {
    vi.mocked(sdk.updateTestCaseStep).mockResolvedValue({
      data: { id: "st1" },
    } as never);

    await testCaseStepsApi.update(
      "p1",
      "s1",
      "c1",
      "st1",
      {
        action: "Click submit",
      } as any,
      1,
    );

    expect(sdk.updateTestCaseStep).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1", case_id: "c1", step_id: "st1" },
      body: {
        action: "Click submit",
      },
      headers: { "if-match": '"1"' },
    });
  });

  it("reorder puts the new order to the reorder endpoint", () => {
    testCaseStepsApi.reorder("p1", "s1", "c1", { steps: [] } as any);

    expect(sdk.reorderTestCaseSteps).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1", case_id: "c1" },
      body: { steps: [] },
    });
  });

  it("delete removes the step by id", () => {
    testCaseStepsApi.delete("p1", "s1", "c1", "st1");

    expect(sdk.deleteTestCaseStep).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1", case_id: "c1", step_id: "st1" },
    });
  });
});
