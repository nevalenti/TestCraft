import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listLabels: vi.fn(),
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
});
