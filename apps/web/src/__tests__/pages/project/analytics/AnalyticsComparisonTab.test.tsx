import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getRouteApi: () => ({ useParams: () => ({ projectId: "proj-1" }) }),
}));

vi.mock("@/features/testRuns/api", () => ({
  testRunQueries: {
    all: vi.fn(() => ({
      queryKey: ["unused-runs"],
      queryFn: vi.fn().mockResolvedValue({ items: [] }),
    })),
  },
}));

vi.mock("@/features/analytics/api", () => ({
  analyticsQueries: {
    runComparison: vi.fn(() => ({
      queryKey: ["unused-comparison"],
      queryFn: vi.fn().mockResolvedValue(null),
      enabled: false,
    })),
  },
}));

import { analyticsQueries } from "@/features/analytics/api";
import { testRunQueries } from "@/features/testRuns/api";
import { AnalyticsComparisonTab } from "@/pages/project/analytics/AnalyticsComparisonTab";

const runs = [
  {
    id: "a",
    name: "Run A",
    environment: "staging",
    status: "completed",
    created_at: "2026-10-01T00:00:00Z",
  },
  {
    id: "b",
    name: "Run B",
    environment: "staging",
    status: "completed",
    created_at: "2026-10-02T00:00:00Z",
  },
];

const mockRuns = (items: unknown[] = runs) => {
  vi.mocked(testRunQueries.all).mockReturnValue({
    queryKey: ["unused-runs"],
    queryFn: vi.fn().mockResolvedValue({ items }),
  } as never);
};

const mockComparison = (result: unknown) => {
  vi.mocked(analyticsQueries.runComparison).mockImplementation(
    (_projectId: string, runAId: string, runBId: string) =>
      ({
        queryKey: ["comparison", runAId, runBId],
        queryFn: vi.fn().mockResolvedValue(result),
        enabled: !!runAId && !!runBId,
      }) as never,
  );
};

const comparisonResult = {
  run_a_name: "Run A",
  run_b_name: "Run B",
  results: [
    {
      test_case_id: "tc1",
      test_case_name: "Regressed test",
      status_in_a: "passed",
      status_in_b: "failed",
      is_regression: true,
      is_fix: false,
    },
    {
      test_case_id: "tc2",
      test_case_name: "Fixed test",
      status_in_a: "failed",
      status_in_b: "passed",
      is_regression: false,
      is_fix: true,
    },
    {
      test_case_id: "tc3",
      test_case_name: "Stable test",
      status_in_a: "passed",
      status_in_b: "passed",
      is_regression: false,
      is_fix: false,
    },
  ],
};

const renderWithClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<AnalyticsComparisonTab />, { wrapper });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRuns();
  mockComparison(null);
});

describe("AnalyticsComparisonTab", () => {
  describe("given fewer than two runs — prompts to select two runs", () => {
    it("shows the initial empty state", async () => {
      mockRuns([runs[0]]);
      renderWithClient();
      expect(
        await screen.findByText("Select two runs to compare"),
      ).toBeInTheDocument();
    });

    it("disables the Compare button", async () => {
      mockRuns([runs[0]]);
      renderWithClient();
      await screen.findByText("Run A");
      expect(screen.getByRole("button", { name: /compare/i })).toBeDisabled();
    });
  });

  describe("given two runs — compares the latest pair on open", () => {
    it("compares the previous run against the newest without a click", async () => {
      mockComparison(comparisonResult);
      renderWithClient();

      expect(await screen.findByText("Regressed test")).toBeInTheDocument();
      expect(screen.getByLabelText("Run A")).toHaveValue("a");
      expect(screen.getByLabelText("Run B")).toHaveValue("b");
    });
  });

  describe("given two different runs selected — Compare is enabled", () => {
    it("enables the Compare button and runs the comparison on click", async () => {
      mockComparison(comparisonResult);
      renderWithClient();
      await screen.findAllByRole("option", { name: "Run A" });

      await userEvent.selectOptions(screen.getByLabelText("Run A"), "a");
      await userEvent.selectOptions(screen.getByLabelText("Run B"), "b");
      expect(screen.getByRole("button", { name: /compare/i })).toBeEnabled();

      await userEvent.click(screen.getByRole("button", { name: /compare/i }));

      await waitFor(() =>
        expect(screen.getByText("Regressed test")).toBeInTheDocument(),
      );
      expect(screen.getByText("Fixed test")).toBeInTheDocument();
      expect(screen.getByText("Stable test")).toBeInTheDocument();
    });
  });

  describe("given a comparison result — the Changes only filter hides unchanged rows", () => {
    it("shows only regressions and fixes when toggled", async () => {
      mockComparison(comparisonResult);
      renderWithClient();
      await screen.findAllByRole("option", { name: "Run A" });

      await userEvent.selectOptions(screen.getByLabelText("Run A"), "a");
      await userEvent.selectOptions(screen.getByLabelText("Run B"), "b");
      await userEvent.click(screen.getByRole("button", { name: /compare/i }));
      await screen.findByText("Stable test");

      await userEvent.click(
        screen.getByRole("button", { name: /changes only/i }),
      );

      expect(screen.getByText("Regressed test")).toBeInTheDocument();
      expect(screen.getByText("Fixed test")).toBeInTheDocument();
      expect(screen.queryByText("Stable test")).not.toBeInTheDocument();
    });
  });
});
