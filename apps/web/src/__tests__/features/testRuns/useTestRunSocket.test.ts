import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FakeWebSocket } from "@/__tests__/fakeWebSocket";
import { useTestRunSocket } from "@/features/testRuns/useTestRunSocket";

vi.stubGlobal("WebSocket", FakeWebSocket);

const createSocketTicketMock = vi.hoisted(() => vi.fn());
vi.mock("@/features/testRuns/api", () => ({
  testRunsApi: { createSocketTicket: createSocketTicketMock },
}));

vi.mock("@/lib/env", () => ({
  env: { VITE_API_URL: "http://localhost:5000" },
}));

const notifyMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/notify", () => ({ notify: notifyMock }));

beforeEach(() => {
  FakeWebSocket.instances.length = 0;
  notifyMock.mockClear();
  createSocketTicketMock.mockReset();
  createSocketTicketMock.mockResolvedValue("ticket-1");
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const latestSocket = () => FakeWebSocket.instances.at(-1)!;

const flush = () => act(async () => {});

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

describe("useTestRunSocket", () => {
  describe("given no runId", () => {
    it("does not open a connection", async () => {
      renderHook(() => useTestRunSocket("project-1", undefined, {}));
      await flush();

      expect(FakeWebSocket.instances).toHaveLength(0);
    });
  });

  describe("given a runId", () => {
    it("opens a connection to /ws/runs/{runId} with a fresh ticket, not the token", async () => {
      renderHook(() => useTestRunSocket("project-1", "run-1", {}));
      await flush();

      expect(createSocketTicketMock).toHaveBeenCalledWith("project-1", "run-1");
      const url = new URL(latestSocket().url);
      expect(url.pathname).toBe("/ws/runs/run-1");
      expect(url.searchParams.get("ticket")).toBe("ticket-1");
      expect(url.searchParams.has("token")).toBe(false);
    });

    it("does not open a connection when unmounted before the ticket arrives", async () => {
      const { unmount } = renderHook(() =>
        useTestRunSocket("project-1", "run-1", {}),
      );
      unmount();
      await flush();

      expect(FakeWebSocket.instances).toHaveLength(0);
    });

    it("uses wss:// when the API URL is https://", async () => {
      vi.doMock("@/lib/env", () => ({
        env: { VITE_API_URL: "https://api.example.com" },
      }));
      vi.resetModules();
      const { useTestRunSocket: freshHook } =
        await import("@/features/testRuns/useTestRunSocket");

      renderHook(() => freshHook("project-1", "run-1", {}));
      await flush();

      expect(latestSocket().url.startsWith("wss://")).toBe(true);
    });
  });

  describe("given handlers", () => {
    it("dispatches an incoming message to the matching handler", async () => {
      const handler = vi.fn();
      renderHook(() =>
        useTestRunSocket("project-1", "run-1", { "result.added": handler }),
      );
      await flush();

      act(() => latestSocket().receive("result.added", { id: "1" }));

      expect(handler).toHaveBeenCalledWith({ id: "1" });
    });

    it("ignores an event name with no registered handler", async () => {
      renderHook(() => useTestRunSocket("project-1", "run-1", {}));
      await flush();

      expect(() =>
        act(() => latestSocket().receive("Unknown", null)),
      ).not.toThrow();
    });
  });

  describe("given updated handlers", () => {
    it("always dispatches to the latest handler version, no reconnect needed", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const { rerender } = renderHook(
        ({ handler }) =>
          useTestRunSocket("project-1", "run-1", { "result.added": handler }),
        { initialProps: { handler: handler1 } },
      );
      await flush();
      const socketCountBeforeRerender = FakeWebSocket.instances.length;

      rerender({ handler: handler2 });
      act(() => latestSocket().receive("result.added", {}));

      expect(FakeWebSocket.instances).toHaveLength(socketCountBeforeRerender);
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it("dispatches a newly added event name with no reconnect needed", async () => {
      const resultAdded = vi.fn();
      const runStatusChanged = vi.fn();
      const { rerender } = renderHook(
        ({ handlers }) => useTestRunSocket("project-1", "run-1", handlers),
        {
          initialProps: {
            handlers: { "result.added": resultAdded } as Record<
              string,
              (data: unknown) => void
            >,
          },
        },
      );
      await flush();

      rerender({
        handlers: {
          "result.added": resultAdded,
          "run.status_changed": runStatusChanged,
        },
      });
      act(() => latestSocket().receive("run.status_changed", "Completed"));

      expect(runStatusChanged).toHaveBeenCalledWith("Completed");
    });
  });

  describe("on the server closing with 1008 (policy violation)", () => {
    it("does not attempt to reconnect", async () => {
      renderHook(() => useTestRunSocket("project-1", "run-1", {}));
      await flush();
      const socketCountBefore = FakeWebSocket.instances.length;

      act(() => latestSocket().failToClose(1008));
      await advance(60_000);

      expect(FakeWebSocket.instances).toHaveLength(socketCountBefore);
    });

    it("shows no toast", async () => {
      renderHook(() => useTestRunSocket("project-1", "run-1", {}));
      await flush();

      act(() => latestSocket().failToClose(1008));

      expect(notifyMock).not.toHaveBeenCalled();
    });
  });

  describe("on the initial connection failing", () => {
    it("shows the unavailable toast and retries", async () => {
      renderHook(() => useTestRunSocket("project-1", "run-1", {}));
      await flush();
      const socketCountBefore = FakeWebSocket.instances.length;

      act(() => latestSocket().failToClose(1006));
      await advance(1000);

      expect(notifyMock).toHaveBeenCalledWith(
        expect.stringContaining("unavailable"),
        "error",
      );
      expect(FakeWebSocket.instances).toHaveLength(socketCountBefore + 1);
    });
  });

  describe("on a connection dropping after connecting successfully", () => {
    it("shows the reconnecting toast and reconnects with backoff", async () => {
      renderHook(() => useTestRunSocket("project-1", "run-1", {}));
      await flush();
      act(() => latestSocket().open());
      const socketCountBefore = FakeWebSocket.instances.length;

      act(() => latestSocket().failToClose(1006));

      expect(notifyMock).toHaveBeenCalledWith(
        expect.stringContaining("reconnecting"),
        "error",
      );
      expect(FakeWebSocket.instances).toHaveLength(socketCountBefore);

      await advance(1000);

      expect(FakeWebSocket.instances).toHaveLength(socketCountBefore + 1);
    });

    it("calls onReconnected once the new connection opens", async () => {
      const onReconnected = vi.fn();
      renderHook(() =>
        useTestRunSocket("project-1", "run-1", {}, onReconnected),
      );
      await flush();
      act(() => latestSocket().open());

      act(() => latestSocket().failToClose(1006));
      await advance(1000);
      act(() => latestSocket().open());

      expect(onReconnected).toHaveBeenCalledOnce();
    });
  });

  describe("on an outage spanning several reconnect attempts", () => {
    it("shows one disconnected toast, then one restored toast", async () => {
      renderHook(() => useTestRunSocket("project-1", "run-1", {}));
      await flush();
      act(() => latestSocket().open());
      createSocketTicketMock
        .mockRejectedValueOnce(new Error("offline"))
        .mockRejectedValueOnce(new Error("offline"));

      act(() => latestSocket().failToClose(1006));
      await advance(1000);
      await advance(2000);
      await advance(4000);

      expect(notifyMock).toHaveBeenCalledOnce();
      expect(notifyMock).toHaveBeenCalledWith(
        expect.stringContaining("disconnected"),
        "error",
      );

      act(() => latestSocket().open());

      expect(notifyMock).toHaveBeenCalledTimes(2);
      expect(notifyMock).toHaveBeenLastCalledWith(
        "Live updates restored",
        "info",
      );

      act(() => latestSocket().failToClose(1006));

      expect(notifyMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("on unmount", () => {
    it("closes the socket", async () => {
      const { unmount } = renderHook(() =>
        useTestRunSocket("project-1", "run-1", {}),
      );
      await flush();
      const socket = latestSocket();

      unmount();

      expect(socket.close).toHaveBeenCalledOnce();
    });

    it("does not show a toast or reconnect for the resulting close", async () => {
      const { unmount } = renderHook(() =>
        useTestRunSocket("project-1", "run-1", {}),
      );
      await flush();
      act(() => latestSocket().open());
      const socketCountBefore = FakeWebSocket.instances.length;

      unmount();
      await advance(60_000);

      expect(notifyMock).not.toHaveBeenCalled();
      expect(FakeWebSocket.instances).toHaveLength(socketCountBefore);
    });
  });

  describe("on the ticket request failing", () => {
    it("shows the unavailable toast and opens no socket on the first attempt", async () => {
      createSocketTicketMock.mockRejectedValue(new Error("offline"));

      renderHook(() => useTestRunSocket("project-1", "run-1", {}));
      await flush();
      await advance(60_000);

      expect(FakeWebSocket.instances).toHaveLength(0);
      expect(notifyMock).toHaveBeenCalledWith(
        expect.stringContaining("unavailable"),
        "error",
      );
    });

    it("keeps retrying with backoff after an earlier successful connection", async () => {
      renderHook(() => useTestRunSocket("project-1", "run-1", {}));
      await flush();
      act(() => latestSocket().open());
      createSocketTicketMock.mockRejectedValueOnce(new Error("offline"));

      act(() => latestSocket().failToClose(1006));
      await advance(1000);
      await advance(2000);

      expect(createSocketTicketMock).toHaveBeenCalledTimes(3);
      expect(FakeWebSocket.instances).toHaveLength(2);
    });
  });

  describe("on reconnecting", () => {
    it("requests a new ticket for each connection", async () => {
      createSocketTicketMock
        .mockResolvedValueOnce("ticket-1")
        .mockResolvedValueOnce("ticket-2");
      renderHook(() => useTestRunSocket("project-1", "run-1", {}));
      await flush();
      act(() => latestSocket().open());

      act(() => latestSocket().failToClose(1006));
      await advance(1000);

      expect(new URL(latestSocket().url).searchParams.get("ticket")).toBe(
        "ticket-2",
      );
    });
  });
});
