import type { Paginated, TestRun } from "@testcraft/types";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pages = vi.hoisted(() => ({
  active: {} as Record<string, unknown>,
  completed: {} as Record<string, unknown>,
}));

vi.mock("@/features/testRuns/api", () => ({
  testRunQueries: {
    active: (projectId: string) => ({
      queryKey: ["projects", projectId, "runs", "dashboard", "active"],
      queryFn: () => pages.active[projectId],
    }),
    recentlyCompleted: (projectId: string, limit: number) => ({
      queryKey: [
        "projects",
        projectId,
        "runs",
        "dashboard",
        "completed",
        limit,
      ],
      queryFn: () => pages.completed[projectId],
    }),
  },
  testRunsApi: {},
}));

import { createWrapper } from "@/__tests__/test-utils";
import {
  DASHBOARD_COMPLETED_LIMIT,
  useDashboardRuns,
} from "@/features/dashboard/hooks";

const run = (id: string, updatedAt: string) =>
  ({ id, name: id, updated_at: updatedAt, created_at: updatedAt }) as TestRun;

const page = (items: TestRun[], total = items.length): Paginated<TestRun> => ({
  items,
  total,
  page: 1,
  page_size: DASHBOARD_COMPLETED_LIMIT,
});

describe("useDashboardRuns", () => {
  it("merges projects, newest completed first, with server totals as counts", async () => {
    pages.active = {
      p1: page([run("a1", "2026-10-01")]),
      p2: page([run("a2", "2026-10-02")]),
    };
    pages.completed = {
      p1: page([run("c1", "2026-10-03"), run("c3", "2026-10-01")], 80),
      p2: page([run("c2", "2026-10-02")], 40),
    };

    const { result } = renderHook(() => useDashboardRuns(["p1", "p2"]), {
      wrapper: createWrapper().wrapper,
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.activeRuns.map(({ id }) => id)).toEqual(["a1", "a2"]);
    expect(result.current.completedRuns.map(({ id }) => id)).toEqual([
      "c1",
      "c2",
      "c3",
    ]);
    expect(result.current.activeCount).toBe(2);
    expect(result.current.completedCount).toBe(120);
  });

  it("keeps only the most recent completed runs across all projects", async () => {
    const many = (prefix: string, day: string) =>
      Array.from({ length: DASHBOARD_COMPLETED_LIMIT }, (_, i) =>
        run(`${prefix}${i}`, `${day}T00:00:${String(i).padStart(2, "0")}`),
      );
    pages.active = { p1: page([]), p2: page([]) };
    pages.completed = {
      p1: page(many("old", "2026-09-01")),
      p2: page(many("new", "2026-10-01")),
    };

    const { result } = renderHook(() => useDashboardRuns(["p1", "p2"]), {
      wrapper: createWrapper().wrapper,
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.completedRuns).toHaveLength(
      DASHBOARD_COMPLETED_LIMIT,
    );
    expect(
      result.current.completedRuns.every(({ id }) => id.startsWith("new")),
    ).toBe(true);
  });
});
