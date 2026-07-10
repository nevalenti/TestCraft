import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchToken } from "../core/auth";
import * as log from "../core/log";

describe("fetchToken", () => {
  const fetchMock = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  describe("fetchToken — given Keycloak returns a token — posts a password-grant request and returns the access token", () => {
    it("returns the access_token from the response", async () => {
      vi.stubGlobal("fetch", fetchMock);
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ access_token: "the-token" }), {
          status: 200,
        }),
      );

      const token = await fetchToken(
        "https://kc.example.com/realms/testcraft",
        "user",
        "pass",
      );

      expect(token).toBe("the-token");
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        "https://kc.example.com/realms/testcraft/protocol/openid-connect/token",
      );
      expect(init.method).toBe("POST");
      const body = init.body as URLSearchParams;
      expect(body.get("grant_type")).toBe("password");
      expect(body.get("client_id")).toBe("testcraft-web");
      expect(body.get("username")).toBe("user");
      expect(body.get("password")).toBe("pass");
    });

    it("registers the returned token as a secret so later logs redact it", async () => {
      vi.stubGlobal("fetch", fetchMock);
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ access_token: "shh-do-not-log-me" }), {
          status: 200,
        }),
      );
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await fetchToken("https://kc.example.com", "user", "pass");
      log.info("token was shh-do-not-log-me");

      expect(logSpy).toHaveBeenCalledWith("token was ***");
      logSpy.mockRestore();
    });
  });

  describe("fetchToken — given Keycloak rejects the credentials — throws with the auth-failure context", () => {
    it("rejects with a descriptive error", async () => {
      vi.stubGlobal("fetch", fetchMock);
      fetchMock.mockResolvedValue(
        new Response("invalid credentials", { status: 401 }),
      );

      await expect(
        fetchToken("https://kc.example.com", "user", "wrong-pass"),
      ).rejects.toThrow(/Keycloak auth failed: 401/);
    });
  });
});
