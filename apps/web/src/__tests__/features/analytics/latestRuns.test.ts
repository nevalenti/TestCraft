import { type TestRun, TestRunStatus } from "@testcraft/types";
import { describe, expect, it } from "vitest";

import { latestRuns } from "@/features/analytics/latestRuns";

const run = (id: string, createdAt: string, status: TestRunStatus) =>
  ({ id, created_at: createdAt, status }) as TestRun;

describe("latestRuns", () => {
  it("prefers completed runs, newest first", () => {
    const runs = [
      run("old", "2026-10-01T00:00:00Z", TestRunStatus.Completed),
      run("active", "2026-10-16T00:00:00Z", TestRunStatus.Active),
      run("new", "2026-10-10T00:00:00Z", TestRunStatus.Completed),
    ];

    expect(latestRuns(runs).map((entry) => entry.id)).toEqual(["new", "old"]);
  });

  it("falls back to any run when none are completed", () => {
    const runs = [run("active", "2026-10-16T00:00:00Z", TestRunStatus.Active)];

    expect(latestRuns(runs).map((entry) => entry.id)).toEqual(["active"]);
  });
});
