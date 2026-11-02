import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { usePersistentSort } from "@/hooks/usePersistentSort";
import { toggleSort } from "@/lib/sort";

const KEYS = ["name", "date"] as const;

describe("usePersistentSort", () => {
  beforeEach(() => localStorage.clear());

  it("restores the last sort for the same table", () => {
    const first = renderHook(() => usePersistentSort("runs", KEYS));
    act(() =>
      first.result.current[1]((previous) => toggleSort(previous, "date")),
    );
    first.unmount();

    const second = renderHook(() => usePersistentSort("runs", KEYS));

    expect(second.result.current[0]).toEqual({ key: "date", direction: "asc" });
  });

  it("forgets the sort once it is cleared", () => {
    const first = renderHook(() => usePersistentSort("runs", KEYS));
    act(() => first.result.current[1]({ key: "name", direction: "desc" }));
    act(() => first.result.current[1](null));
    first.unmount();

    const second = renderHook(() => usePersistentSort("runs", KEYS));

    expect(second.result.current[0]).toBeNull();
  });

  it("ignores a stored column that no longer exists", () => {
    localStorage.setItem(
      "testcraft:sort:runs",
      JSON.stringify({ key: "removed", direction: "asc" }),
    );

    const { result } = renderHook(() => usePersistentSort("runs", KEYS));

    expect(result.current[0]).toBeNull();
  });
});
