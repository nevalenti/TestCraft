import { TestRunStatus } from "@testcraft/types";
import { describe, expect, it } from "vitest";

import { canAddResultToRun, canTransitionRunStatus } from "@/domain/rules";

describe("canTransitionRunStatus #unit", { tags: ["unit"] }, () => {
  describe("given a forward transition", () => {
    it("allows Active → Completed", () => {
      expect(
        canTransitionRunStatus(TestRunStatus.Active, TestRunStatus.Completed),
      ).toBe(true);
    });

    it("allows Active → Archived", () => {
      expect(
        canTransitionRunStatus(TestRunStatus.Active, TestRunStatus.Archived),
      ).toBe(true);
    });

    it("allows Completed → Archived", () => {
      expect(
        canTransitionRunStatus(TestRunStatus.Completed, TestRunStatus.Archived),
      ).toBe(true);
    });
  });

  describe("given the same status", () => {
    it("allows Active → Active (idempotent)", () => {
      expect(
        canTransitionRunStatus(TestRunStatus.Active, TestRunStatus.Active),
      ).toBe(true);
    });
  });

  describe("given a backward transition", () => {
    it("blocks Completed → Active", () => {
      expect(
        canTransitionRunStatus(TestRunStatus.Completed, TestRunStatus.Active),
      ).toBe(false);
    });

    it("blocks Archived → Active", () => {
      expect(
        canTransitionRunStatus(TestRunStatus.Archived, TestRunStatus.Active),
      ).toBe(false);
    });

    it("blocks Archived → Completed", () => {
      expect(
        canTransitionRunStatus(TestRunStatus.Archived, TestRunStatus.Completed),
      ).toBe(false);
    });
  });
});

describe("canAddResultToRun #unit", { tags: ["unit"] }, () => {
  describe("given a non-archived run", () => {
    it("allows adding results to an Active run", () => {
      expect(canAddResultToRun(TestRunStatus.Active)).toBe(true);
    });

    it("allows adding results to a Completed run", () => {
      expect(canAddResultToRun(TestRunStatus.Completed)).toBe(true);
    });
  });

  describe("given an Archived run", () => {
    it("blocks adding results", () => {
      expect(canAddResultToRun(TestRunStatus.Archived)).toBe(false);
    });
  });
});
