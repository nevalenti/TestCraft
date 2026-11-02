import { beforeEach, describe, expect, it, vi } from "vitest";

const requestUse = vi.fn();
const responseUse = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: requestUse },
        response: { use: responseUse },
      },
    })),
  },
}));

vi.mock("@/auth/keycloak", () => ({
  keycloak: {
    authenticated: false,
    token: undefined,
    updateToken: vi.fn(),
    login: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  env: { VITE_API_URL: "https://api.example.com" },
}));

vi.mock("@/lib/errorReporting", () => ({ reportApiError: vi.fn() }));

import { keycloak } from "@/auth/keycloak";
import { reportApiError } from "@/lib/errorReporting";

describe("api client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("request interceptor — given an authenticated session", () => {
    it("attaches a fresh bearer token after refreshing", async () => {
      vi.mocked(keycloak).authenticated = true;
      vi.mocked(keycloak).token = "fresh-token";
      vi.mocked(keycloak.updateToken).mockResolvedValue(true);
      await import("@/api/client");

      const requestHandler = requestUse.mock.calls[0][0];
      const config = await requestHandler({ headers: {} as any });

      expect(keycloak.updateToken).toHaveBeenCalledWith(30);
      expect(config.headers.Authorization).toBe("Bearer fresh-token");
    });

    it("redirects to login and aborts the request when token refresh fails", async () => {
      vi.mocked(keycloak).authenticated = true;
      vi.mocked(keycloak.updateToken).mockRejectedValue(new Error("expired"));
      await import("@/api/client");

      const requestHandler = requestUse.mock.calls[0][0];

      await expect(
        requestHandler({ headers: {} as any }),
      ).rejects.toBeDefined();
      expect(keycloak.login).toHaveBeenCalled();
    });
  });

  describe("request interceptor — given several requests failing token refresh", () => {
    it("redirects to login only once", async () => {
      vi.mocked(keycloak).authenticated = true;
      vi.mocked(keycloak.updateToken).mockRejectedValue(new Error("expired"));
      await import("@/api/client");

      const requestHandler = requestUse.mock.calls[0][0];
      await Promise.allSettled([
        requestHandler({ headers: {} as any }),
        requestHandler({ headers: {} as any }),
        requestHandler({ headers: {} as any }),
      ]);

      expect(keycloak.login).toHaveBeenCalledOnce();
    });
  });

  describe("request interceptor — given no authenticated session", () => {
    it("does not attach an Authorization header", async () => {
      vi.mocked(keycloak).authenticated = false;
      await import("@/api/client");

      const requestHandler = requestUse.mock.calls[0][0];
      const config = await requestHandler({ headers: {} as any });

      expect(config.headers.Authorization).toBeUndefined();
    });
  });

  describe("response interceptor — given a server error", () => {
    it("reports it with its status and request id", async () => {
      await import("@/api/client");

      const errorHandler = responseUse.mock.calls[0][1];
      const error = {
        config: { method: "get", url: "/projects" },
        response: { status: 502, headers: { "x-request-id": "req-1" } },
      };
      await expect(errorHandler(error)).rejects.toBe(error);

      expect(reportApiError).toHaveBeenCalledWith(error, {
        status: 502,
        method: "get",
        url: "/projects",
        requestId: "req-1",
      });
    });

    it("does not report client errors or failed connections", async () => {
      await import("@/api/client");

      const errorHandler = responseUse.mock.calls[0][1];
      for (const response of [{ status: 404, headers: {} }, undefined]) {
        await expect(
          errorHandler({ config: { method: "get" }, response }),
        ).rejects.toBeDefined();
      }

      expect(reportApiError).not.toHaveBeenCalled();
    });
  });

  describe("response interceptor — given a successful response", () => {
    it("passes it through unchanged", async () => {
      await import("@/api/client");

      const successHandler = responseUse.mock.calls[0][0];
      const response = { data: { ok: true } };

      expect(successHandler(response)).toBe(response);
    });
  });
});
