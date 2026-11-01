import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FakeWebSocket } from "@/__tests__/fakeWebSocket";
import { createWrapper } from "@/__tests__/test-utils";
import { useDashboardRealtime } from "@/features/dashboard/useDashboardRealtime";

vi.stubGlobal("WebSocket", FakeWebSocket);

vi.mock("@/features/projects/api", () => ({
  projectsApi: {
    createDashboardSocketTicket: vi.fn().mockResolvedValue("ticket-1"),
  },
}));

vi.mock("@/lib/env", () => ({
  env: { VITE_API_URL: "http://localhost:5000" },
}));

beforeEach(() => {
  FakeWebSocket.instances.length = 0;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const latestSocket = () => FakeWebSocket.instances.at(-1)!;

const renderRealtime = async () => {
  const { queryClient, wrapper } = createWrapper();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  renderHook(() => useDashboardRealtime(["project-1"]), { wrapper });
  await act(async () => {});
  return invalidate;
};

describe("useDashboardRealtime", () => {
  it("does not refresh the dashboard on the first connection", async () => {
    const invalidate = await renderRealtime();

    act(() => latestSocket().open());

    expect(invalidate).not.toHaveBeenCalled();
  });

  it("refreshes the dashboard after reconnecting", async () => {
    const invalidate = await renderRealtime();
    act(() => latestSocket().open());

    act(() => latestSocket().failToClose(1006));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    act(() => latestSocket().open());

    expect(invalidate).toHaveBeenCalledWith(
      { queryKey: ["projects", "project-1", "runs"] },
      { cancelRefetch: false },
    );
  });

  it("batches run changes into one refresh per project", async () => {
    const invalidate = await renderRealtime();
    act(() => latestSocket().open());

    act(() => {
      latestSocket().receive("run.changed", {
        project_id: "project-1",
        run_id: "run-1",
      });
      latestSocket().receive("run.changed", {
        project_id: "project-1",
        run_id: "run-2",
      });
    });
    await act(() => vi.advanceTimersByTimeAsync(100));

    expect(
      invalidate.mock.calls.filter(
        ([filters]) => filters?.queryKey?.[2] === "runs",
      ),
    ).toHaveLength(1);
  });
});
