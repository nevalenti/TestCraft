import type { ErrorEvent } from "@sentry/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
  captureException: vi.fn(),
  tanstackRouterBrowserTracingIntegration: vi.fn(() => ({
    name: "TanStackRouter",
  })),
}));

const env = vi.hoisted(() => ({
  VITE_API_URL: "https://testcraft.example",
  VITE_GLITCHTIP_DSN: "https://key@glitchtip.example/1" as string | undefined,
  VITE_RELEASE: "abc123",
  VITE_ENVIRONMENT: "production" as "production" | "local",
  VITE_TRACES_SAMPLE_RATE: undefined as number | undefined,
}));
vi.mock("@/lib/env", () => ({ env }));
vi.mock("@/lib/pageId", () => ({ pageId: "page-1" }));

import * as Sentry from "@sentry/react";

import {
  initErrorReporting,
  reportApiError,
  scrubEvent,
  scrubUrl,
  setReportingUser,
} from "@/lib/errorReporting";

const router = { id: "router" };

describe("errorReporting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.VITE_GLITCHTIP_DSN = "https://key@glitchtip.example/1";
    env.VITE_ENVIRONMENT = "production";
    env.VITE_TRACES_SAMPLE_RATE = undefined;
  });

  describe("initErrorReporting", () => {
    it("does nothing without a DSN", () => {
      env.VITE_GLITCHTIP_DSN = "";
      initErrorReporting(router);
      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it("tags the release and environment, and traces only our own API", () => {
      initErrorReporting(router);

      const options = vi.mocked(Sentry.init).mock.calls[0]![0]!;
      expect(options.release).toBe("abc123");
      expect(options.environment).toBe("production");
      expect(options.tracePropagationTargets).toEqual([
        "https://testcraft.example/api/",
      ]);
      expect(options.propagateTraceparent).toBe(true);
      expect(
        Sentry.tanstackRouterBrowserTracingIntegration,
      ).toHaveBeenCalledWith(router);
      expect(Sentry.setTag).toHaveBeenCalledWith("page_id", "page-1");
    });

    it("samples a tenth of production traces and every local one", () => {
      initErrorReporting(router);
      env.VITE_ENVIRONMENT = "local";
      initErrorReporting(router);

      const rates = vi
        .mocked(Sentry.init)
        .mock.calls.map(([options]) => options!.tracesSampleRate);
      expect(rates).toEqual([0.1, 1]);
    });

    it("lets the sample rate be overridden", () => {
      env.VITE_TRACES_SAMPLE_RATE = 0.5;
      initErrorReporting(router);
      expect(vi.mocked(Sentry.init).mock.calls[0]![0]!.tracesSampleRate).toBe(
        0.5,
      );
    });
  });

  describe("scrubbing", () => {
    it.each([
      [
        "https://testcraft.example/#state=abc&session_state=def&code=ghi",
        "https://testcraft.example/#state=[Filtered]&session_state=[Filtered]&code=[Filtered]",
      ],
      [
        "https://testcraft.example/share/s3cr3t-token?x=1",
        "https://testcraft.example/share/[Filtered]?x=1",
      ],
      [
        "https://testcraft.example/projects/1",
        "https://testcraft.example/projects/1",
      ],
    ])("scrubs %s", (url, expected) => {
      expect(scrubUrl(url)).toBe(expected);
    });

    it("scrubs the request URL, referer and breadcrumb URLs of an event", () => {
      const event = {
        type: undefined,
        request: {
          url: "https://testcraft.example/share/tok",
          headers: { Referer: "https://testcraft.example/#code=c" },
        },
        breadcrumbs: [
          {
            data: {
              url: "https://testcraft.example/share/tok",
              to: "/share/tok",
            },
          },
        ],
      } as ErrorEvent;

      const scrubbed = scrubEvent(event);

      expect(JSON.stringify(scrubbed)).not.toMatch(/tok"|code=c/);
    });
  });

  it("identifies the user by id only", () => {
    setReportingUser("user-1");
    setReportingUser(undefined);
    expect(vi.mocked(Sentry.setUser).mock.calls).toEqual([
      [{ id: "user-1" }],
      [null],
    ]);
  });

  it("tags API errors with their status and request id", () => {
    const error = new Error("Request failed with status code 500");

    reportApiError(error, {
      status: 500,
      method: "post",
      url: "/share/tok",
      requestId: "req-1",
    });

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { http_status: 500, request_id: "req-1" },
      extra: { method: "post", url: "/share/[Filtered]" },
    });
  });
});
