import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIsLoadingVisible } from "@/hooks/useIsLoadingVisible";

const renderLoading = (isLoading: boolean) =>
  renderHook(
    ({ loading }: { loading: boolean }) => useIsLoadingVisible(loading),
    { initialProps: { loading: isLoading }, wrapper: StrictMode },
  );

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useIsLoadingVisible", () => {
  it("never shows loading that finishes before the delay", () => {
    const { result, rerender } = renderLoading(true);

    act(() => vi.advanceTimersByTime(100));
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(1000));

    expect(result.current).toBe(false);
  });

  it("shows loading once the delay passes", () => {
    const { result } = renderLoading(true);

    act(() => vi.advanceTimersByTime(150));

    expect(result.current).toBe(true);
  });

  it("keeps the indicator up for the minimum time, then hides it with no timers left", () => {
    const { result, rerender } = renderLoading(true);
    act(() => vi.advanceTimersByTime(150));

    act(() => vi.advanceTimersByTime(100));
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stays visible when loading restarts during the minimum display time", () => {
    const { result, rerender } = renderLoading(true);
    act(() => vi.advanceTimersByTime(250));
    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(10));

    rerender({ loading: true });
    act(() => vi.advanceTimersByTime(1000));

    expect(result.current).toBe(true);
  });

  it("hides at once when the minimum time has already passed", () => {
    const { result, rerender } = renderLoading(true);
    act(() => vi.advanceTimersByTime(1000));

    rerender({ loading: false });
    act(() => vi.advanceTimersByTime(0));

    expect(result.current).toBe(false);
  });
});
