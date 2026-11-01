import type { TestResult } from "@testcraft/types";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ResultsBySuite } from "@/features/testResults/ResultsBySuite";

const result = (
  id: string,
  suiteId: string,
  status: TestResult["status"],
): TestResult =>
  ({
    id,
    suite_id: suiteId,
    test_case_id: `case-${id}`,
    test_case_name: `Case ${id}`,
    status,
    duration_ms: 1200,
    executed_at: new Date().toISOString(),
  }) as TestResult;

const suiteNames = new Map([
  ["auth", "Authentication"],
  ["pay", "Payments"],
]);

const renderGroups = (onEdit = vi.fn()) =>
  render(
    <ResultsBySuite
      results={[
        result("1", "auth", "passed"),
        result("2", "auth", "passed"),
        result("3", "pay", "passed"),
        result("4", "pay", "failed"),
      ]}
      suiteNames={suiteNames}
      onEdit={onEdit}
      onAttachment={vi.fn()}
    />,
  );

const suiteToggle = (name: string) =>
  screen.getByRole("button", { name: new RegExp(name) });

describe("ResultsBySuite", () => {
  it("lists suites with problems first, open, with their counts", () => {
    renderGroups();

    const [firstSuite] = screen.getAllByRole("button", { expanded: true });
    expect(firstSuite).toHaveTextContent("Payments");
    expect(suiteToggle("Payments")).toHaveTextContent("1 passed · 1 failed");
    expect(suiteToggle("Payments")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Case 4")).toBeVisible();
  });

  it("collapses suites where everything passed until opened", async () => {
    renderGroups();

    expect(suiteToggle("Authentication")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByText("Case 1")).not.toBeVisible();

    await userEvent.click(suiteToggle("Authentication"));

    expect(screen.getByText("Case 1")).toBeVisible();
  });

  it("edits a result from its row", async () => {
    const onEdit = vi.fn();
    renderGroups(onEdit);

    const row = screen.getByText("Case 4").closest("li")!;
    await userEvent.click(
      within(row).getByRole("button", { name: "Edit result" }),
    );

    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: "4", status: "failed" }),
    );
  });
});
