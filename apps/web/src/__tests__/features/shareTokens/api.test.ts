import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  getRunByShareToken: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { shareTokensApi } from "@/features/shareTokens/api";
import { TABLE_PAGE_SIZE } from "@/lib/constants";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("shareTokensApi", () => {
  it("getByToken fetches the shared run by its public token, not nested under a project", async () => {
    vi.mocked(sdk.getRunByShareToken).mockResolvedValue({
      data: { runId: "r1" },
    } as never);

    const result = await shareTokensApi.getByToken("public-token");

    expect(sdk.getRunByShareToken).toHaveBeenCalledWith({
      path: { token: "public-token" },
      query: { page: 1, page_size: TABLE_PAGE_SIZE },
    });
    expect(result).toEqual({ runId: "r1" });
  });
});
