import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { findCached } from "@/api/findCached";

describe("findCached", () => {
  const key = ["things"];

  it("returns the cached item with the given id", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(key, [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);

    expect(
      findCached<{ id: string; name: string }>(queryClient, key, "b"),
    ).toEqual({
      id: "b",
      name: "B",
    });
  });

  it("returns undefined when the list is not cached or the id is missing", () => {
    const queryClient = new QueryClient();

    expect(findCached(queryClient, key, "a")).toBeUndefined();

    queryClient.setQueryData(key, [{ id: "a" }]);
    expect(findCached(queryClient, key, "z")).toBeUndefined();
  });
});
