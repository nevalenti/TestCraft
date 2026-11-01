import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/sdk", () => ({
  getAvatarUrl: vi.fn(),
  uploadAvatar: vi.fn(),
}));

import * as sdk from "@/api/sdk";
import { accountApi } from "@/features/account/api";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("accountApi.getAvatarUrl", () => {
  describe("given the server returns 200 with a URL", () => {
    it("returns the avatar url payload", async () => {
      vi.mocked(sdk.getAvatarUrl).mockResolvedValue({
        status: 200,
        data: { url: "https://cdn.example.com/a.png" },
      } as never);

      const result = await accountApi.getAvatarUrl();

      expect(sdk.getAvatarUrl).toHaveBeenCalledWith({});
      expect(result).toEqual({ url: "https://cdn.example.com/a.png" });
    });
  });

  describe("given no avatar is set", () => {
    it("returns the payload with a null url", async () => {
      vi.mocked(sdk.getAvatarUrl).mockResolvedValue({
        status: 200,
        data: { url: null },
      } as never);

      const result = await accountApi.getAvatarUrl();

      expect(result).toEqual({ url: null });
    });
  });
});

describe("accountApi.uploadAvatar", () => {
  it("PUTs a multipart form containing the file", async () => {
    vi.mocked(sdk.uploadAvatar).mockResolvedValue({
      data: { url: "https://cdn.example.com/new.png" },
    } as never);
    const file = new File(["x"], "avatar.png", { type: "image/png" });

    const result = await accountApi.uploadAvatar(file);

    expect(sdk.uploadAvatar).toHaveBeenCalledWith({ body: { file } });
    expect(vi.mocked(sdk.uploadAvatar).mock.calls[0][0]?.body).toEqual({
      file,
    });
    expect(result).toEqual({ url: "https://cdn.example.com/new.png" });
  });
});
