import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime } from "@/lib/format";

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
