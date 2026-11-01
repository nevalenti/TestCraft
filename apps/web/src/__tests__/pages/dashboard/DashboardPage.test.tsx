import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children?: React.ReactNode;
    to: string;
    className?: string;
    params?: unknown;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();

  return { ...actual, useQueries: vi.fn() };
});

vi.mock("@/features/projects/hooks", () => ({
  useProjects: vi.fn(),
}));

vi.mock("@/hooks/useBreadcrumbs", () => ({ useBreadcrumbs: vi.fn() }));
vi.mock("@/features/dashboard/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/dashboard/hooks")>()),
  useDashboardSummary: vi.fn(),
}));
vi.mock("@/features/dashboard/useDashboardRealtime", () => ({
  useDashboardRealtime: vi.fn(() => ({ isConnected: false })),
}));

import { useQueries } from "@tanstack/react-query";
import { TestRunStatus } from "@testcraft/types";

import { useDashboardSummary } from "@/features/dashboard/hooks";
import { useDashboardRealtime } from "@/features/dashboard/useDashboardRealtime";
import { useProjects } from "@/features/projects/hooks";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { useDashboardTabStore } from "@/stores/dashboardTab";

const makeProject = (id: string, name: string) => ({
  id,
  userId: "user-1",
  name,
  description: null,
  suite_count: 2,
  run_count: 1,
  created_at: "2026-01-15",
  updated_at: "2026-01-15",
});

const makeRun = (id: string, projectId: string, status: TestRunStatus) => ({
  id,
  projectId,
  name: `Run ${id}`,
  environment: "staging",
  status,
  executed_by_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const summary = {
  window_days: 7,
  pass_rate: 82.5,
  previous_pass_rate: 78,
  executed_count: 40,
  failing_test_count: 3,
  flaky_test_count: 2,
  active_run_count: 1,
  top_failing_tests: [
    {
      test_case_id: "case-1",
      test_case_name: "Checkout total is correct",
      suite_id: "suite-1",
      project_id: "proj-1",
      project_name: "Alpha",
      failure_count: 4,
      last_failed_at: new Date().toISOString(),
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  useDashboardTabStore.setState({ tab: "active" });
  vi.mocked(useDashboardSummary).mockReturnValue({
    data: summary,
    isError: false,
  } as unknown as ReturnType<typeof useDashboardSummary>);
});

const setupMocks = ({
  projects = [makeProject("proj-1", "Alpha")],
  projectsPending = false,
  activeRuns = [] as ReturnType<typeof makeRun>[],
  recentlyCompletedRuns = [] as ReturnType<typeof makeRun>[],
  runsPending = false,
  runsError = false,
  recentlyCompletedTotal = undefined as number | undefined,
} = {}) => {
  vi.mocked(useProjects).mockReturnValue({
    data: projects,
    isPending: projectsPending,
    isError: false,
  } as unknown as ReturnType<typeof useProjects>);

  vi.mocked(useQueries).mockImplementation(
    (options: Parameters<typeof useQueries>[0]) => {
      let probe: unknown;
      try {
        probe = (options as { combine?: (r: unknown[]) => unknown }).combine?.(
          [],
        );
      } catch {
        probe = null;
      }
      if (
        probe !== null &&
        typeof probe === "object" &&
        "activeRuns" in probe
      ) {
        return {
          activeRuns,
          completedRuns: recentlyCompletedRuns,
          activeCount: activeRuns.length,
          completedCount:
            recentlyCompletedTotal ?? recentlyCompletedRuns.length,
          isPending: runsPending,
          isError: runsError,
          error: runsError ? new Error("unavailable") : null,
          refetch: vi.fn(),
        } as unknown as ReturnType<typeof useQueries>;
      }
      return new Map() as unknown as ReturnType<typeof useQueries>;
    },
  );
};

const runQueryRefetchIntervals = () =>
  (
    vi.mocked(useQueries).mock.calls as unknown as [
      { queries: { refetchInterval?: number | false }[] },
    ][]
  )
    .find(([options]) => options.queries.length > 0)![0]
    .queries.map((query) => query.refetchInterval);

describe("DashboardPage", () => {
  describe("polling", () => {
    it("polls runs while live updates are disconnected", () => {
      setupMocks();
      render(<DashboardPage />);

      expect(runQueryRefetchIntervals()).toEqual([30_000, 30_000]);
    });

    it("stops polling runs while live updates are connected", () => {
      vi.mocked(useDashboardRealtime).mockReturnValue({ isConnected: true });
      setupMocks();
      render(<DashboardPage />);

      expect(runQueryRefetchIntervals()).toEqual([false, false]);
    });
  });

  describe("renders the runs tabs", () => {
    it("shows the Active Runs tab", () => {
      setupMocks();
      render(<DashboardPage />);
      expect(
        screen.getByRole("button", { name: /Active Runs/ }),
      ).toBeInTheDocument();
    });

    it("shows the Recently Completed tab", () => {
      setupMocks();
      render(<DashboardPage />);
      expect(
        screen.getByRole("button", { name: /Recently Completed/ }),
      ).toBeInTheDocument();
    });
  });

  describe("loading state — shows skeleton", () => {
    it("renders a loading status region when projects are pending", async () => {
      setupMocks({ projectsPending: true });
      render(<DashboardPage />);
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Loading dashboard",
      );
    });
  });

  describe("empty runs — shows the no active runs message", () => {
    it("renders the no active runs placeholder", () => {
      setupMocks({ activeRuns: [] });
      render(<DashboardPage />);
      expect(screen.getByText("No active runs")).toBeInTheDocument();
      expect(
        screen.getByText("Active test runs will appear here."),
      ).toBeInTheDocument();
    });
  });

  it("shows a retry state when a project run request fails", () => {
    setupMocks({ runsError: true });
    render(<DashboardPage />);
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByText("No active runs")).not.toBeInTheDocument();
  });

  it("counts every completed run on the server, not just the loaded ones", () => {
    setupMocks({
      recentlyCompletedRuns: [
        makeRun("run-2", "proj-1", TestRunStatus.Completed),
      ],
      recentlyCompletedTotal: 120,
    });
    render(<DashboardPage />);
    expect(
      screen.getByRole("button", { name: /Recently Completed/ }),
    ).toHaveTextContent("120");
  });

  describe("with active runs — renders each run", () => {
    it("displays the run name", () => {
      const run = makeRun("run-1", "proj-1", TestRunStatus.Active);

      setupMocks({
        projects: [makeProject("proj-1", "Alpha")],
        activeRuns: [run],
      });
      render(<DashboardPage />);
      expect(screen.getByText("Run run-1")).toBeInTheDocument();
    });
  });

  describe("weekly summary", () => {
    it("shows the stat tiles and the tests needing attention", () => {
      setupMocks();
      render(<DashboardPage />);

      expect(screen.getByText("82.5%")).toBeInTheDocument();
      expect(
        screen.getByText("Up 4.5 pts on the week before"),
      ).toBeInTheDocument();
      expect(screen.getByText("Failing tests")).toBeInTheDocument();
      expect(screen.getByText("Checkout total is correct")).toBeInTheDocument();
      expect(screen.getByText("Project health")).toBeInTheDocument();
    });

    it("celebrates a week without failures", () => {
      vi.mocked(useDashboardSummary).mockReturnValue({
        data: { ...summary, top_failing_tests: [] },
        isError: false,
      } as unknown as ReturnType<typeof useDashboardSummary>);
      setupMocks();
      render(<DashboardPage />);

      expect(screen.getByText("Nothing failed this week.")).toBeInTheDocument();
    });
  });

  it("points new users to create a project", () => {
    setupMocks({ projects: [] });
    render(<DashboardPage />);

    expect(screen.getByText("No projects yet")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to projects" }),
    ).toHaveAttribute("href", "/projects");
  });
});
