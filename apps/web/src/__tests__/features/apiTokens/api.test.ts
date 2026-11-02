import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  listApiTokens: vi.fn(),
  createApiToken: vi.fn(),
  revokeApiToken: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { apiTokensApi } from "@/features/apiTokens/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("apiTokensApi", () => {
  it("getAll fetches tokens for the project", async () => {
    vi.mocked(sdk.listApiTokens).mockResolvedValue({
      data: [],
    } as never);

    await apiTokensApi.getAll("p1");

    expect(sdk.listApiTokens).toHaveBeenCalledWith({
      path: { project_id: "p1" },
    });
  });

  it("create posts the token input", async () => {
    vi.mocked(sdk.createApiToken).mockResolvedValue({
      data: { id: "t1" },
    } as never);

    await apiTokensApi.create("p1", { name: "CI token" } as any);

    expect(sdk.createApiToken).toHaveBeenCalledWith({
      path: { project_id: "p1" },
      body: {
        name: "CI token",
      },
    });
  });

  it("revoke deletes the token by id", () => {
    apiTokensApi.revoke("p1", "t1");

    expect(sdk.revokeApiToken).toHaveBeenCalledWith({
      path: { project_id: "p1", token_id: "t1" },
    });
  });
});
