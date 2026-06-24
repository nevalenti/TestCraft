import type { TestRunSummary } from "@testcraft/types";
import { TestResultStatus } from "@testcraft/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RunSummaryBar } from "@/pages/TestRunPage/RunSummaryBar";

const makeSummary = (
  overrides: Partial<TestRunSummary> = {},
): TestRunSummary => ({
  total: 0,
  passed: 0,
  failed: 0,
  blocked: 0,
  skipped: 0,
  passRate: 0,
  ...overrides,
});

const defaultProps = {
  statusFilter: null,
  onStatusFilter: vi.fn(),
  search: "",
  onSearch: vi.fn(),
  onAdd: vi.fn(),
};

describe("RunSummaryBar", () => {
  describe("given zero results — shows zeroed totals", () => {
    it("renders 0 total", () => {
      render(<RunSummaryBar runSummary={makeSummary()} {...defaultProps} />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("renders 0% pass rate", () => {
      render(<RunSummaryBar runSummary={makeSummary()} {...defaultProps} />);
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("does not render status filter buttons when counts are zero", () => {
      render(<RunSummaryBar runSummary={makeSummary()} {...defaultProps} />);
      expect(screen.queryByText("Passed")).not.toBeInTheDocument();
      expect(screen.queryByText("Failed")).not.toBeInTheDocument();
    });
  });

  describe("given results — shows totals and pass rate", () => {
    it("renders the total result count", () => {
      render(
        <RunSummaryBar
          runSummary={makeSummary({ total: 12, passed: 10, passRate: 83 })}
          {...defaultProps}
        />,
      );
      expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("renders the pass rate percentage", () => {
      render(
        <RunSummaryBar
          runSummary={makeSummary({ total: 10, passed: 8, passRate: 80 })}
          {...defaultProps}
        />,
      );
      expect(screen.getByText("80%")).toBeInTheDocument();
    });

    it("renders status filter buttons for non-zero statuses", () => {
      render(
        <RunSummaryBar
          runSummary={makeSummary({
            total: 5,
            passed: 3,
            failed: 2,
            passRate: 60,
          })}
          {...defaultProps}
        />,
      );
      expect(screen.getByText("Passed")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });

    it("does not render a status button when its count is zero", () => {
      render(
        <RunSummaryBar
          runSummary={makeSummary({ total: 3, passed: 3, passRate: 100 })}
          {...defaultProps}
        />,
      );
      expect(screen.getByText("Passed")).toBeInTheDocument();
      expect(screen.queryByText("Failed")).not.toBeInTheDocument();
      expect(screen.queryByText("Blocked")).not.toBeInTheDocument();
    });
  });

  describe("Add Result button — is rendered", () => {
    it("shows the Add Result button", () => {
      render(<RunSummaryBar runSummary={makeSummary()} {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /Add Result/i }),
      ).toBeInTheDocument();
    });

    it("calls onAdd when clicked", async () => {
      const onAdd = vi.fn();
      render(
        <RunSummaryBar
          runSummary={makeSummary()}
          {...defaultProps}
          onAdd={onAdd}
        />,
      );
      await userEvent.click(
        screen.getByRole("button", { name: /Add Result/i }),
      );
      expect(onAdd).toHaveBeenCalledOnce();
    });
  });

  describe("given a statusFilter — shows the All results button", () => {
    it("renders the All results button when a filter is active", () => {
      render(
        <RunSummaryBar
          runSummary={makeSummary({ total: 5, passed: 5, passRate: 100 })}
          {...defaultProps}
          statusFilter={TestResultStatus.Passed}
        />,
      );
      expect(
        screen.getByRole("button", { name: "All results" }),
      ).toBeInTheDocument();
    });

    it("does not render All results when no filter is set", () => {
      render(
        <RunSummaryBar
          runSummary={makeSummary({ total: 5, passed: 5, passRate: 100 })}
          {...defaultProps}
          statusFilter={null}
        />,
      );
      expect(
        screen.queryByRole("button", { name: "All results" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("singular result — uses singular noun", () => {
    it("renders '1 result' without plural s", () => {
      render(
        <RunSummaryBar
          runSummary={makeSummary({ total: 1, passed: 1, passRate: 100 })}
          {...defaultProps}
        />,
      );
      // The summary paragraph contains "1 result · 100% pass rate"
      expect(screen.getByText(/result ·/)).toBeInTheDocument();
      expect(screen.queryByText(/results ·/)).not.toBeInTheDocument();
    });
  });
});
