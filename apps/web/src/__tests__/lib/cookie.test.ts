import { afterEach, describe, expect, it } from "vitest";

import { getCookie, removeCookie, setCookie } from "@/lib/cookie";

const clearAll = () => {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=", 1)[0];

    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    }
  }
};

afterEach(clearAll);

describe("getCookie", () => {
  describe("getCookie — given the cookie does not exist — returns null", () => {
    it("returns null for an unknown key", () => {
      expect(getCookie("nonexistent-cookie")).toBeNull();
    });
  });

  describe("getCookie — given the cookie was set — returns the decoded value", () => {
    it("returns a plain string value", () => {
      setCookie("test-plain", "hello");
      expect(getCookie("test-plain")).toBe("hello");
    });

    it("returns a value with spaces (URL-decoded)", () => {
      setCookie("test-spaces", "hello world");
      expect(getCookie("test-spaces")).toBe("hello world");
    });

    it("returns a JSON-serialised value as a string", () => {
      setCookie("test-json", JSON.stringify({ a: 1 }));
      expect(getCookie("test-json")).toBe('{"a":1}');
    });
  });
});

describe("setCookie", () => {
  describe("setCookie — given a key and value — persists the cookie", () => {
    it("makes the value readable by getCookie", () => {
      setCookie("my-key", "my-value");
      expect(getCookie("my-key")).toBe("my-value");
    });

    it("overwrites a previously set value for the same key", () => {
      setCookie("dup-key", "first");
      setCookie("dup-key", "second");
      expect(getCookie("dup-key")).toBe("second");
    });
  });
});

describe("removeCookie", () => {
  describe("removeCookie — given an existing cookie — deletes it", () => {
    it("makes getCookie return null after removal", () => {
      setCookie("to-remove", "value");
      expect(getCookie("to-remove")).toBe("value");

      removeCookie("to-remove");
      expect(getCookie("to-remove")).toBeNull();
    });
  });

  describe("removeCookie — given a cookie that does not exist — does not throw", () => {
    it("completes without error", () => {
      expect(() => removeCookie("never-set")).not.toThrow();
    });
  });
});
