import type { Project, TestRun, TestRunSummary } from "@testcraft/types";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    ...rest
  }: {
    children?: React.ReactNode;
    to: string;
    params: Record<string, string>;
  }) => (
    <a href={to} data-params={JSON.stringify(params)} {...rest}>
      {children}
    </a>
  ),
}));

import { CompletedRunTableRow } from "@/features/dashboard/CompletedRunTableRow";

const run = {
  id: "r1",
  project_id: "p1",
  name: "Nightly regression",
  environment: "staging",
  source: "github",
  executed_by_name: null,
  created_at: "2026-10-17T10:00:00Z",
  updated_at: "2026-10-17T11:00:00Z",
} as TestRun;

const project = { id: "p1", name: "Checkout" } as Project;

const summary = (passed: number, failed: number) =>
  ({ total: passed + failed, passed, failed }) as TestRunSummary;

const renderRow = (
  rowSummary: TestRunSummary | undefined,
  rowProject: Project | null = project,
) =>
  render(
    <table>
      <tbody>
        <CompletedRunTableRow
          run={run}
          project={rowProject ?? undefined}
          summary={rowSummary}
        />
      </tbody>
    </table>,
  );

describe("CompletedRunTableRow", () => {
  it("links the run and its project", () => {
    renderRow(summary(10, 0));

    const runLink = screen.getByRole("link", { name: /nightly regression/i });
    expect(runLink).toHaveAttribute("href", "/projects/$projectId/runs/$runId");
    expect(runLink).toHaveAttribute(
      "data-params",
      JSON.stringify({ projectId: "p1", runId: "r1" }),
    );
    const projectLink = screen.getByRole("link", { name: "Checkout" });
    expect(projectLink).toHaveAttribute("href", "/projects/$projectId/runs");
    expect(projectLink).toHaveAttribute(
      "data-params",
      JSON.stringify({ projectId: "p1" }),
    );
  });

  it("shows the pass rate of the run", () => {
    renderRow(summary(17, 3));

    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("says so when the run logged no results", () => {
    renderRow(summary(0, 0));

    expect(screen.getByText("No results logged")).toBeInTheDocument();
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
  });

  it("shows a placeholder when the project is not loaded", () => {
    renderRow(summary(1, 0), null);

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
