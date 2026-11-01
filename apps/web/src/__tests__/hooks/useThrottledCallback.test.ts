import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useThrottledCallback } from "@/hooks/useThrottledCallback";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useThrottledCallback", () => {
  it("runs a burst once immediately and once more after the interval", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(callback, 1000));

    for (let call = 0; call < 50; call += 1) {
      result.current();
      vi.advanceTimersByTime(10);
    }
    expect(callback).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("drops a pending run after unmounting", () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() =>
      useThrottledCallback(callback, 1000),
    );

    result.current();
    unmount();
    vi.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
  });
});
