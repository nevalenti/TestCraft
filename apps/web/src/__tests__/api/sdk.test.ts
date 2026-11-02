import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth/keycloak", () => ({
  keycloak: {
    authenticated: true,
    token: "refreshed-token",
    updateToken: vi.fn().mockResolvedValue(false),
  },
}));

import { apiClient } from "@/api/client";
import * as sdk from "@/api/sdk";
import { keycloak } from "@/auth/keycloak";

const originalAdapter = apiClient.defaults.adapter;
let requests: InternalAxiosRequestConfig[];

beforeEach(() => {
  requests = [];
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config);
    return {
      data: { items: [], url: "https://example.com/avatar" },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  apiClient.defaults.adapter = adapter;
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  vi.clearAllMocks();
});

describe("generated SDK transport", () => {
  it("uses the existing auth interceptor, API prefix, and query serialization", async () => {
    await sdk.listProjects({
      query: { page: 2, page_size: 25, search: "name & spaces" },
    });
    const request = requests[0];
    const url = new URL(apiClient.getUri(request));
    expect(url.pathname).toBe("/api/v1/projects");
    expect(url.searchParams.get("search")).toBe("name & spaces");
    expect(url.searchParams.get("page")).toBe("2");
    expect(keycloak.updateToken).toHaveBeenCalledWith(30);
    expect(request.headers.get("Authorization")).toBe("Bearer refreshed-token");
    expect(request.headers.get("X-Page-Id")).toBeTruthy();
  });

  it("serializes avatar uploads as multipart data", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    await sdk.uploadAvatar({ body: { file } });
    expect(requests[0].data).toBeInstanceOf(FormData);
    expect((requests[0].data as FormData).get("file")).toBe(file);
    expect(requests[0].method).toBe("put");
  });

  it("propagates transport failures to query and mutation callers", async () => {
    const failure = new Error("Network unavailable");
    apiClient.defaults.adapter = async () => {
      throw failure;
    };
    await expect(sdk.listProjects({})).rejects.toBe(failure);
  });
});
