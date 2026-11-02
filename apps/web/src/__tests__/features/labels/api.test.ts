import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listLabels: vi.fn(),
  createLabel: vi.fn(),
  updateLabel: vi.fn(),
  deleteLabel: vi.fn(),
  addTestCaseLabel: vi.fn(),
  removeTestCaseLabel: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { labelsApi } from "@/features/labels/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("labelsApi", () => {
  it("getAll returns the labels of every page", async () => {
    vi.mocked(sdk.listLabels).mockResolvedValue({
      data: { items: [{ id: "x1" }], total: 1, page: 1, page_size: 500 },
    } as never);

    const result = await labelsApi.getAll("p1");

    expect(result).toEqual([{ id: "x1" }]);
    expect(sdk.listLabels).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      query: { page: 1, page_size: 500 },
    });
  });

  it("create posts the new label", async () => {
    vi.mocked(sdk.createLabel).mockResolvedValue({
      data: { id: "l1" },
    } as never);

    await labelsApi.create("p1", { name: "Regression", color: "#f00" } as any);

    expect(sdk.createLabel).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      body: {
        name: "Regression",
        color: "#f00",
      },
    });
  });

  it("update puts the label changes", async () => {
    vi.mocked(sdk.updateLabel).mockResolvedValue({
      data: { id: "l1" },
    } as never);

    await labelsApi.update("p1", "l1", { name: "Smoke" } as any, 1);

    expect(sdk.updateLabel).toHaveBeenCalledWith({
      path: { project_id: "p1", label_id: "l1" },
      body: {
        name: "Smoke",
      },
      headers: { "if-match": '"1"' },
    });
  });

  it("delete removes the label by id", () => {
    labelsApi.delete("p1", "l1");

    expect(sdk.deleteLabel).toHaveBeenCalledWith({
      path: { project_id: "p1", label_id: "l1" },
    });
  });

  it("addToCase posts to the nested case-label association endpoint, not the label base path", () => {
    labelsApi.addToCase("p1", "case1", "l1");

    expect(sdk.addTestCaseLabel).toHaveBeenCalledWith({
      path: { project_id: "p1", case_id: "case1", label_id: "l1" },
    });
  });

  it("removeFromCase deletes the nested case-label association", () => {
    labelsApi.removeFromCase("p1", "case1", "l1");

    expect(sdk.removeTestCaseLabel).toHaveBeenCalledWith({
      path: { project_id: "p1", case_id: "case1", label_id: "l1" },
    });
  });
});
