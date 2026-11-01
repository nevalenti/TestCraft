import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertOk,
  authHeaders,
  fetchJson,
  fetchWithRetry,
  idempotencyKeyHeader,
} from "../core/http";

describe("authHeaders", () => {
  describe("authHeaders — given a token — returns a Bearer authorization header plus a fixed user agent", () => {
    it("builds the expected headers object", () => {
      expect(authHeaders("abc123")).toEqual({
        Authorization: "Bearer abc123",
        "User-Agent": "TestCraft-CI-Reporter/1.0",
      });
    });
  });
});

describe("assertOk", () => {
  describe("assertOk — given a 2xx response — resolves without throwing", () => {
    it("does not throw for a 200", async () => {
      await expect(
        assertOk(new Response(null, { status: 200 }), "ctx"),
      ).resolves.toBeUndefined();
    });
  });

  describe("assertOk — given a non-2xx response with a body — throws including the status and body", () => {
    it("includes status text and response body in the error", async () => {
      const response = new Response("invalid project id", {
        status: 404,
        statusText: "Not Found",
      });

      await expect(assertOk(response, "Failed to create run")).rejects.toThrow(
        /Failed to create run: 404 Not Found\ninvalid project id/,
      );
    });
  });

  describe("assertOk — given a non-2xx response with an empty body — throws without a trailing newline", () => {
    it("omits the body section entirely", async () => {
      const response = new Response("", { status: 500 });

      await expect(assertOk(response, "ctx")).rejects.toThrow("ctx: 500 ");
    });
  });
});

describe("fetchWithRetry", () => {
  const fetchMock = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    vi.useRealTimers();
  });

  describe("fetchWithRetry — given fetch succeeds on the first attempt — returns immediately without retrying", () => {
    it("calls fetch exactly once", async () => {
      vi.stubGlobal("fetch", fetchMock);
      const response = new Response(null, { status: 200 });
      fetchMock.mockResolvedValue(response);

      const result = await fetchWithRetry("https://x.test", {}, "ctx");

      expect(result).toBe(response);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchWithRetry — given fetch throws (network failure) before succeeding — retries until it succeeds", () => {
    it("retries and eventually returns the successful response", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", fetchMock);
      const response = new Response(null, { status: 200 });
      fetchMock
        .mockRejectedValueOnce(new Error("ECONNREFUSED"))
        .mockResolvedValueOnce(response);

      const promise = fetchWithRetry("https://x.test", {}, "ctx");
      await vi.runAllTimersAsync();

      await expect(promise).resolves.toBe(response);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("fetchWithRetry — given fetch keeps throwing for every attempt — throws a wrapped error after exhausting retries", () => {
    it("surfaces the underlying error message with the given context", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", fetchMock);
      fetchMock.mockRejectedValue(new Error("DNS lookup failed"));

      const promise = fetchWithRetry(
        "https://x.test",
        {},
        "Failed to reach API",
      );
      const assertion = expect(promise).rejects.toThrow(
        "Failed to reach API: DNS lookup failed",
      );
      await vi.runAllTimersAsync();
      await assertion;

      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("fetchWithRetry — given the server responds with a non-2xx status — does not retry", () => {
    it("returns the error response after a single call", async () => {
      vi.stubGlobal("fetch", fetchMock);
      const response = new Response(null, { status: 500 });
      fetchMock.mockResolvedValue(response);

      const result = await fetchWithRetry("https://x.test", {}, "ctx");

      expect(result).toBe(response);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe("fetchWithRetry — transient server errors", () => {
  const fetchMock = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    vi.useRealTimers();
  });

  describe("given a POST with an idempotency key that gets a 503 — retries with the same key", () => {
    it("sends the identical key on every attempt and returns the eventual success", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", fetchMock);
      const success = new Response(null, { status: 201 });
      fetchMock
        .mockResolvedValueOnce(new Response(null, { status: 503 }))
        .mockResolvedValueOnce(success);
      const init = { method: "POST", headers: { ...idempotencyKeyHeader() } };

      const promise = fetchWithRetry("https://x.test", init, "ctx");
      await vi.runAllTimersAsync();

      await expect(promise).resolves.toBe(success);
      const keys = fetchMock.mock.calls.map(([, sent]) =>
        new Headers((sent as RequestInit).headers).get("Idempotency-Key"),
      );
      expect(keys).toHaveLength(2);
      expect(keys[0]).toBeTruthy();
      expect(keys[1]).toBe(keys[0]);
    });
  });

  describe("given a POST without an idempotency key that gets a 503 — does not retry", () => {
    it("returns the 503 after one call, since repeating could duplicate the write", async () => {
      vi.stubGlobal("fetch", fetchMock);
      const unavailable = new Response(null, { status: 503 });
      fetchMock.mockResolvedValue(unavailable);

      const result = await fetchWithRetry(
        "https://x.test",
        { method: "POST" },
        "ctx",
      );

      expect(result).toBe(unavailable);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("given a POST whose first attempt is still in progress — retries with the same key", () => {
    it("repeats the request after a 409 IDEMPOTENT_REQUEST_IN_PROGRESS and returns the replay", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", fetchMock);
      const replay = new Response(null, { status: 201 });
      fetchMock
        .mockResolvedValueOnce(
          Response.json(
            { status: 409, code: "IDEMPOTENT_REQUEST_IN_PROGRESS" },
            { status: 409 },
          ),
        )
        .mockResolvedValueOnce(replay);
      const init = { method: "POST", headers: { ...idempotencyKeyHeader() } };

      const promise = fetchWithRetry("https://x.test", init, "ctx");
      await vi.runAllTimersAsync();

      await expect(promise).resolves.toBe(replay);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("given a POST that gets any other 409 — does not retry", () => {
    it("returns the conflict after one call", async () => {
      vi.stubGlobal("fetch", fetchMock);
      const conflict = Response.json(
        { status: 409, code: "MEMBER_ALREADY_EXISTS" },
        { status: 409 },
      );
      fetchMock.mockResolvedValue(conflict);
      const init = { method: "POST", headers: { ...idempotencyKeyHeader() } };

      const result = await fetchWithRetry("https://x.test", init, "ctx");

      expect(result).toBe(conflict);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("given a GET that keeps getting 502 — gives up after the last attempt", () => {
    it("returns the final 502 after three calls", async () => {
      vi.useFakeTimers();
      vi.stubGlobal("fetch", fetchMock);
      fetchMock.mockImplementation(
        async () => new Response(null, { status: 502 }),
      );

      const promise = fetchWithRetry("https://x.test", {}, "ctx");
      await vi.runAllTimersAsync();

      const response = await promise;
      expect(response.status).toBe(502);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});

describe("fetchJson", () => {
  const fetchMock = vi.fn();

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  describe("fetchJson — given a successful response with a JSON body — parses and returns it", () => {
    it("returns the parsed payload", async () => {
      vi.stubGlobal("fetch", fetchMock);
      fetchMock.mockResolvedValue(Response.json({ ok: true }, { status: 200 }));

      const result = await fetchJson<{ ok: boolean }>(
        "https://x.test",
        {},
        "ctx",
      );

      expect(result).toEqual({ ok: true });
    });
  });

  describe("fetchJson — given an error response — throws before attempting to parse JSON", () => {
    it("rejects with the assertOk error", async () => {
      vi.stubGlobal("fetch", fetchMock);
      fetchMock.mockResolvedValue(new Response("bad request", { status: 400 }));

      await expect(
        fetchJson("https://x.test", {}, "Request failed"),
      ).rejects.toThrow(/Request failed: 400/);
    });
  });
});
