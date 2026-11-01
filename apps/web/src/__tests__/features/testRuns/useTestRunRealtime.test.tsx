import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createWrapper } from "@/__tests__/test-utils";
import { queryKeys } from "@/api/queryKeys";
import { useTestRunRealtime } from "@/features/testRuns/useTestRunRealtime";
import { useTestRunSocket } from "@/features/testRuns/useTestRunSocket";

vi.mock("@/features/testRuns/useTestRunSocket", () => ({
  useTestRunSocket: vi.fn(),
}));
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const setup = () => {
  const context = createWrapper();
  const keys = {
    list: [...queryKeys.testRuns.all("p1"), "search"],
    detail: queryKeys.testRuns.detail("p1", "r1"),
    results: [...queryKeys.testResults.all("p1", "r1"), 1],
    summary: queryKeys.testRuns.summary("p1", "r1"),
    logs: queryKeys.testRuns.logs("p1", "r1"),
    analytics: queryKeys.analytics.trend("p1", 20),
    otherProject: queryKeys.testRuns.all("p2"),
  };
  for (const key of Object.values(keys))
    context.queryClient.setQueryData(key, []);
  renderHook(() => useTestRunRealtime("p1", "r1"), {
    wrapper: context.wrapper,
  });
  const call = vi.mocked(useTestRunSocket).mock.lastCall!;
  return { ...context, keys, handlers: call[2], onReconnect: call[3]! };
};

describe("useTestRunRealtime", () => {
  it.each(["result.added", "result.updated", "result.deleted"])(
    "invalidates result projections, summary and analytics on %s",
    (event) => {
      vi.useFakeTimers();
      const { queryClient, keys, handlers } = setup();
      handlers[event](undefined);
      vi.advanceTimersByTime(0);
      for (const key of [keys.results, keys.summary, keys.analytics]) {
        expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
      }
      expect(queryClient.getQueryState(keys.otherProject)?.isInvalidated).toBe(
        false,
      );
    },
  );

  it("refreshes list and detail projections when a run changes status", () => {
    const { queryClient, keys, handlers } = setup();
    handlers["run.status_changed"](undefined);
    for (const key of [keys.list, keys.detail, keys.analytics]) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
    expect(queryClient.getQueryState(keys.otherProject)?.isInvalidated).toBe(
      false,
    );
  });

  it("refreshes all run projections and analytics after reconnecting", () => {
    const { queryClient, keys, onReconnect } = setup();
    onReconnect();
    for (const [name, key] of Object.entries(keys)) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(
        name !== "otherProject",
      );
    }
  });

  const cachedLogs = {
    lines: ["line 1"],
    earliestSeq: 7,
    latestSeq: 7,
    hasMore: true,
  };

  it("appends a newer batch and advances latestSeq", () => {
    const { queryClient, keys, handlers } = setup();
    queryClient.setQueryData(keys.logs, cachedLogs);
    handlers["logs.appended"]({
      count: 2,
      last_seq: 9,
      lines: ["line 2", "line 3"],
    });
    expect(queryClient.getQueryData(keys.logs)).toEqual({
      lines: ["line 1", "line 2", "line 3"],
      earliestSeq: 7,
      latestSeq: 9,
      hasMore: true,
    });
    expect(queryClient.getQueryState(keys.logs)?.isInvalidated).toBe(false);
  });

  it("appends to an empty log", () => {
    const { queryClient, keys, handlers } = setup();
    queryClient.setQueryData(keys.logs, {
      lines: [],
      earliestSeq: null,
      latestSeq: null,
      hasMore: false,
    });
    handlers["logs.appended"]({ count: 1, last_seq: 3, lines: ["first"] });
    expect(queryClient.getQueryData(keys.logs)).toMatchObject({
      lines: ["first"],
      latestSeq: 3,
    });
  });

  it("refetches instead of appending a batch the fetch may already hold", () => {
    const { queryClient, keys, handlers } = setup();
    queryClient.setQueryData(keys.logs, cachedLogs);
    handlers["logs.appended"]({ count: 1, last_seq: 7, lines: ["line 1"] });
    expect(queryClient.getQueryData(keys.logs)).toEqual(cachedLogs);
    expect(queryClient.getQueryState(keys.logs)?.isInvalidated).toBe(true);
  });

  it("refetches when an older batch commits after a newer one", () => {
    const { queryClient, keys, handlers } = setup();
    queryClient.setQueryData(keys.logs, cachedLogs);
    handlers["logs.appended"]({ count: 1, last_seq: 5, lines: ["late"] });
    expect(queryClient.getQueryData(keys.logs)).toEqual(cachedLogs);
    expect(queryClient.getQueryState(keys.logs)?.isInvalidated).toBe(true);
  });

  it("refetches when logs arrive before the first fetch finishes", () => {
    const { queryClient, keys, handlers } = setup();
    queryClient.removeQueries({ queryKey: keys.logs });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    handlers["logs.appended"]({ count: 1, last_seq: 1, lines: ["first"] });
    expect(queryClient.getQueryData(keys.logs)).toBeUndefined();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: keys.logs });
  });

  it("refetches the logs when a batch was too large to carry its lines", () => {
    const { queryClient, keys, handlers } = setup();
    queryClient.setQueryData(keys.logs, cachedLogs);
    handlers["logs.appended"]({ count: 5000, last_seq: 5001, lines: null });
    expect(queryClient.getQueryState(keys.logs)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryData(keys.logs)).toEqual(cachedLogs);
  });

  it.each([
    { invalid: true },
    ["ok", 42, null],
    { count: 1, last_seq: 1, lines: ["ok", 42] },
    { count: 1, last_seq: "1", lines: ["ok"] },
  ])("rejects malformed logs without changing the cache: %j", (data) => {
    const { queryClient, keys, handlers } = setup();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    handlers["logs.appended"](data);
    expect(queryClient.getQueryData(keys.logs)).toEqual([]);
    expect(consoleError).toHaveBeenCalledOnce();
  });
});
