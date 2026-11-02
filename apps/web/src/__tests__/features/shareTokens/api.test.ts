import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listShareTokens: vi.fn(),
  createShareToken: vi.fn(),
  revokeShareToken: vi.fn(),
  getRunByShareToken: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { shareTokensApi } from "@/features/shareTokens/api";
import { TABLE_PAGE_SIZE } from "@/lib/constants";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("shareTokensApi", () => {
  it("getAll fetches share tokens for the run", async () => {
    vi.mocked(sdk.listShareTokens).mockResolvedValue({
      data: [],
    } as never);

    await shareTokensApi.getAll("p1", "r1");

    expect(sdk.listShareTokens).toHaveBeenCalledWith({
      path: { project_id: "p1", run_id: "r1" },
    });
  });

  it("create posts the expiry payload", async () => {
    vi.mocked(sdk.createShareToken).mockResolvedValue({
      data: { id: "s1" },
    } as never);

    await shareTokensApi.create("p1", "r1", { expires_at: "2026-01-01" });

    expect(sdk.createShareToken).toHaveBeenCalledWith({
      path: { project_id: "p1", run_id: "r1" },
      body: {
        expires_at: "2026-01-01",
      },
    });
  });

  it("revoke deletes the token by id", () => {
    shareTokensApi.revoke("p1", "r1", "s1");

    expect(sdk.revokeShareToken).toHaveBeenCalledWith({
      path: { project_id: "p1", run_id: "r1", token_id: "s1" },
    });
  });

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
