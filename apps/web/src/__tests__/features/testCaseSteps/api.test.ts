import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listTestCaseSteps: vi.fn(),
  reorderTestCaseSteps: vi.fn(),
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

  it("reorder puts the new order to the reorder endpoint", () => {
    testCaseStepsApi.reorder("p1", "s1", "c1", { steps: [] } as any);

    expect(sdk.reorderTestCaseSteps).toHaveBeenCalledWith({
      path: { project_id: "p1", suite_id: "s1", case_id: "c1" },
      body: { steps: [] },
    });
  });
});
