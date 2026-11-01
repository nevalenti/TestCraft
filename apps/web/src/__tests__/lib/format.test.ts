import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime, formatDuration } from "@/lib/format";

describe("formatDate", () => {
  describe("formatDate — given a Date object — returns a human-readable date string", () => {
    it("contains the full year", () => {
      expect(formatDate(new Date("2024-06-15T00:00:00.000Z"))).toContain(
        "2024",
      );
    });

    it("produces the same output as when given an equivalent ISO string", () => {
      const date = new Date("2024-06-15T00:00:00.000Z");

      expect(formatDate(date)).toBe(formatDate(date.toISOString()));
    });

    it("returns a non-empty string", () => {
      expect(formatDate(new Date())).toBeTruthy();
    });
  });

  describe("formatDate — given an ISO string — parses and formats the date", () => {
    it("returns a non-empty string for a valid ISO string", () => {
      expect(formatDate("2023-01-01T00:00:00.000Z")).toBeTruthy();
    });

    it("does not include a time component in the output", () => {
      const result = formatDate("2024-06-15T14:30:00.000Z");

      expect(result).not.toMatch(/\d{1,2}:\d{2}/);
    });
  });
});

describe("formatDateTime", () => {
  describe("formatDateTime — given a Date — returns a date and time string", () => {
    it("contains the full year", () => {
      expect(formatDateTime(new Date("2024-06-15T14:30:00.000Z"))).toContain(
        "2024",
      );
    });

    it("produces the same output as when given an equivalent ISO string", () => {
      const date = new Date("2024-06-15T14:30:00.000Z");

      expect(formatDateTime(date)).toBe(formatDateTime(date.toISOString()));
    });

    it("returns a longer string than formatDate for the same input (time component added)", () => {
      const input = "2024-06-15T14:30:00.000Z";

      expect(formatDateTime(input).length).toBeGreaterThan(
        formatDate(input).length,
      );
    });
  });
});

describe("formatDuration", () => {
  describe("given undefined or null — returns a dash", () => {
    it("returns '—' for undefined", () => {
      expect(formatDuration(undefined)).toBe("—");
    });

    it("returns '—' for null", () => {
      expect(formatDuration(null)).toBe("—");
    });
  });

  describe("given a value under 1000ms — returns milliseconds", () => {
    it("returns '0ms' for 0", () => {
      expect(formatDuration(0)).toBe("0ms");
    });

    it("returns '500ms' for 500", () => {
      expect(formatDuration(500)).toBe("500ms");
    });

    it("returns '999ms' for 999", () => {
      expect(formatDuration(999)).toBe("999ms");
    });
  });

  describe("given a value of 1000ms or more — returns seconds with two decimal places", () => {
    it("returns '1.00s' for 1000", () => {
      expect(formatDuration(1000)).toBe("1.00s");
    });

    it("returns '1.50s' for 1500", () => {
      expect(formatDuration(1500)).toBe("1.50s");
    });

    it("returns '10.00s' for 10000", () => {
      expect(formatDuration(10_000)).toBe("10.00s");
    });
  });
});
