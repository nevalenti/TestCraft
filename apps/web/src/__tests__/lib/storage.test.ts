import { afterEach, describe, expect, it, vi } from "vitest";

import { readStorage, writeStorage } from "@/lib/storage";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("storage", () => {
  it("writes, reads and removes a value", () => {
    writeStorage("key", "value");
    expect(readStorage("key")).toBe("value");

    writeStorage("key", null);
    expect(readStorage("key")).toBeNull();
  });

  it("treats unavailable storage as empty", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });

    expect(() => writeStorage("key", "value")).not.toThrow();
    expect(readStorage("key")).toBeNull();
  });
});
