import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FakeWebSocket } from "@/__tests__/fakeWebSocket";
import { useTicketedSocket } from "@/hooks/useTicketedSocket";

vi.stubGlobal("WebSocket", FakeWebSocket);

vi.mock("@/lib/env", () => ({
  env: { VITE_API_URL: "http://localhost:5000" },
}));

vi.mock("@/lib/notify", () => ({ notify: vi.fn() }));

beforeEach(() => {
  FakeWebSocket.instances.length = 0;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const renderSocket = async (key: string | null) => {
  const hook = renderHook(() =>
    useTicketedSocket({
      key,
      path: "/ws/test",
      getTicket: () => Promise.resolve("ticket-1"),
      onMessage: vi.fn(),
    }),
  );
  await act(async () => {});
  return hook;
};

describe("useTicketedSocket", () => {
  it("opens no connection without a key", async () => {
    const { result } = await renderSocket(null);

    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(result.current.isConnected).toBe(false);
  });

  it("reports the connection state", async () => {
    const { result } = await renderSocket("key-1");
    expect(result.current.isConnected).toBe(false);

    act(() => FakeWebSocket.instances[0].open());
    expect(result.current.isConnected).toBe(true);

    act(() => FakeWebSocket.instances[0].failToClose(1006));
    expect(result.current.isConnected).toBe(false);
  });
});
