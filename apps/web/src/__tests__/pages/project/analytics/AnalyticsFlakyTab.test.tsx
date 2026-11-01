import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getRouteApi: () => ({ useParams: () => ({ projectId: "proj-1" }) }),
}));

vi.mock("@/features/analytics/api", () => ({
  analyticsQueries: {
    flakyTests: vi.fn(() => ({
      queryKey: ["unused-flaky"],
      queryFn: vi.fn().mockResolvedValue([]),
    })),
  },
}));

import { analyticsQueries } from "@/features/analytics/api";
import { AnalyticsFlakyTab } from "@/pages/project/analytics/AnalyticsFlakyTab";

const makeStat = (overrides: Partial<Record<string, unknown>> = {}) => ({
  test_case_id: "t1",
  test_case_name: "Login succeeds",
  flaky_rate: 42,
  total_runs: 10,
  pass_count: 6,
  fail_count: 4,
  ...overrides,
});

const mockFlakyTests = (items: ReturnType<typeof makeStat>[]) => {
  vi.mocked(analyticsQueries.flakyTests).mockReturnValue({
    queryKey: ["unused-flaky"],
    queryFn: vi.fn().mockResolvedValue(items),
  } as never);
};

const renderWithClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<AnalyticsFlakyTab />, { wrapper });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFlakyTests([]);
});

describe("AnalyticsFlakyTab", () => {
  describe("given no flaky tests — shows the empty state", () => {
    it("renders the empty-state copy", async () => {
      renderWithClient();
      expect(
        await screen.findByText("No flaky tests detected"),
      ).toBeInTheDocument();
    });
  });

  describe("given flaky tests — groups them into risk buckets", () => {
    it("counts high, medium, and low risk tests", async () => {
      mockFlakyTests([
        makeStat({
          test_case_id: "t1",
          test_case_name: "High risk",
          flaky_rate: 70,
        }),
        makeStat({
          test_case_id: "t2",
          test_case_name: "Medium risk",
          flaky_rate: 40,
        }),
        makeStat({
          test_case_id: "t3",
          test_case_name: "Low risk",
          flaky_rate: 10,
        }),
      ]);
      renderWithClient();

      await screen.findByText("High risk");

      const highCard = screen.getByText("High Risk").closest("div.flex")!;
      const mediumCard = screen.getByText("Medium Risk").closest("div.flex")!;
      const lowCard = screen.getByText("Low Risk").closest("div.flex")!;

      expect(highCard).toHaveTextContent("1");
      expect(mediumCard).toHaveTextContent("1");
      expect(lowCard).toHaveTextContent("1");
    });

    it("sorts rows by descending flake rate", async () => {
      mockFlakyTests([
        makeStat({
          test_case_id: "t1",
          test_case_name: "Least flaky",
          flaky_rate: 10,
        }),
        makeStat({
          test_case_id: "t2",
          test_case_name: "Most flaky",
          flaky_rate: 90,
        }),
      ]);
      renderWithClient();

      const rows = await screen.findAllByRole("row");
      const bodyRows = rows.slice(1);
      expect(bodyRows[0]).toHaveTextContent("Most flaky");
      expect(bodyRows[1]).toHaveTextContent("Least flaky");
    });

    it("shows pass/fail counts for each test", async () => {
      mockFlakyTests([
        makeStat({
          test_case_id: "t1",
          test_case_name: "Login succeeds",
          total_runs: 10,
          pass_count: 6,
          fail_count: 4,
          flaky_rate: 40,
        }),
      ]);
      renderWithClient();

      const cell = await screen.findByText("Login succeeds");
      const row = cell.closest("tr")!;
      expect(row).toHaveTextContent("10");
      expect(row).toHaveTextContent("6");
      expect(row).toHaveTextContent("4");
      expect(row).toHaveTextContent("40%");
    });
  });
});
