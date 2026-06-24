import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/analytics", () => ({
  analyticsQueries: {
    trend: vi.fn((projectId: string, limit: number) => ({
      queryKey: ["projects", projectId, "analytics", "trend", limit],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
    suiteBreakdown: vi.fn((projectId: string, runId: string) => ({
      queryKey: ["projects", projectId, "analytics", "suite-breakdown", runId],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
    flakyTests: vi.fn((projectId: string, minRuns: number) => ({
      queryKey: ["projects", projectId, "analytics", "flaky", minRuns],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
    runComparison: vi.fn(
      (projectId: string, runAId: string, runBId: string) => ({
        queryKey: [
          "projects",
          projectId,
          "analytics",
          "compare",
          runAId,
          runBId,
        ],
        queryFn: vi.fn().mockResolvedValue(null),
      }),
    ),
  },
}));

import { analyticsQueries } from "@/api/analytics";
import {
  useFlakyTests,
  useRunComparison,
  useRunTrend,
  useSuiteBreakdown,
} from "@/hooks/useAnalytics";

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRunTrend", () => {
  describe("given projectId and limit — calls the trend query factory", () => {
    it("calls analyticsQueries.trend with projectId and limit", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useRunTrend("proj-1", 10), { wrapper });
      expect(analyticsQueries.trend).toHaveBeenCalledWith("proj-1", 10);
    });

    it("uses the default limit of 20 when not specified", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useRunTrend("proj-1"), { wrapper });
      expect(analyticsQueries.trend).toHaveBeenCalledWith("proj-1", 20);
    });
  });
});

describe("useSuiteBreakdown", () => {
  describe("given projectId and runId — calls the suiteBreakdown query factory", () => {
    it("calls analyticsQueries.suiteBreakdown with projectId and runId", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useSuiteBreakdown("proj-1", "run-1"), { wrapper });
      expect(analyticsQueries.suiteBreakdown).toHaveBeenCalledWith(
        "proj-1",
        "run-1",
      );
    });

    it("falls back to empty string when runId is undefined", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useSuiteBreakdown("proj-1", undefined), { wrapper });
      expect(analyticsQueries.suiteBreakdown).toHaveBeenCalledWith(
        "proj-1",
        "",
      );
    });
  });
});

describe("useFlakyTests", () => {
  describe("given projectId and minRuns — calls the flakyTests query factory", () => {
    it("calls analyticsQueries.flakyTests with projectId and minRuns", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useFlakyTests("proj-1", 5), { wrapper });
      expect(analyticsQueries.flakyTests).toHaveBeenCalledWith("proj-1", 5);
    });

    it("uses the default minRuns of 3 when not specified", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useFlakyTests("proj-1"), { wrapper });
      expect(analyticsQueries.flakyTests).toHaveBeenCalledWith("proj-1", 3);
    });
  });
});

describe("useRunComparison", () => {
  describe("given all ids — calls the runComparison query factory", () => {
    it("calls analyticsQueries.runComparison with all three ids", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useRunComparison("proj-1", "run-a", "run-b"), {
        wrapper,
      });
      expect(analyticsQueries.runComparison).toHaveBeenCalledWith(
        "proj-1",
        "run-a",
        "run-b",
      );
    });

    it("falls back to empty strings when run ids are undefined", () => {
      const { wrapper } = makeWrapper();
      renderHook(() => useRunComparison("proj-1"), { wrapper });
      expect(analyticsQueries.runComparison).toHaveBeenCalledWith(
        "proj-1",
        "",
        "",
      );
    });
  });
});
