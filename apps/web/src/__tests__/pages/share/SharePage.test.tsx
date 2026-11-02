import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getRouteApi: () => ({ useParams: () => ({ token: "share-token-1" }) }),
}));

vi.mock("@/features/shareTokens/hooks", () => ({
  useSharedRun: vi.fn(),
}));

import { useSharedRun } from "@/features/shareTokens/hooks";
import { SharePage } from "@/pages/share/SharePage";

const makeRun = (overrides: Partial<Record<string, unknown>> = {}) => ({
  run_name: "Nightly Regression",
  environment: "staging",
  created_at: "2026-01-10T00:00:00Z",
  total: 10,
  passed: 8,
  failed: 1,
  blocked: 1,
  skipped: 0,
  pass_rate: 80,
  results: [
    {
      test_case_name: "Login succeeds",
      status: "passed",
      duration_ms: 1200,
      executed_at: "2026-01-10T01:00:00Z",
      notes: null,
    },
  ],
  results_total: 10,
  page: 1,
  page_size: 10,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SharePage", () => {
  describe("given the run is still loading", () => {
    it("shows a loading status region", async () => {
      vi.mocked(useSharedRun).mockReturnValue({
        data: undefined,
        isPending: true,
        isError: false,
      } as never);
      render(<SharePage />);
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Loading shared run",
      );
    });
  });

  describe("given the token is invalid or expired", () => {
    it("shows a link-not-found message", () => {
      vi.mocked(useSharedRun).mockReturnValue({
        data: undefined,
        isPending: false,
        isError: true,
      } as never);
      render(<SharePage />);
      expect(screen.getByText("Link not found")).toBeInTheDocument();
    });

    it("also shows the not-found message when the run comes back empty", () => {
      vi.mocked(useSharedRun).mockReturnValue({
        data: undefined,
        isPending: false,
        isError: false,
      } as never);
      render(<SharePage />);
      expect(screen.getByText("Link not found")).toBeInTheDocument();
    });
  });

  describe("given a valid shared run", () => {
    it("renders the run name, environment, and stats", () => {
      vi.mocked(useSharedRun).mockReturnValue({
        data: makeRun(),
        isPending: false,
        isError: false,
      } as never);
      render(<SharePage />);

      expect(screen.getByText("Nightly Regression")).toBeInTheDocument();
      expect(screen.getByText("staging")).toBeInTheDocument();
      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("renders a row per result", () => {
      vi.mocked(useSharedRun).mockReturnValue({
        data: makeRun(),
        isPending: false,
        isError: false,
      } as never);
      render(<SharePage />);

      expect(screen.getByText("Login succeeds")).toBeInTheDocument();
    });
  });
});
