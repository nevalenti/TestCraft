import type { Label } from "@testcraft/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/labels/hooks", () => ({
  useLabels: vi.fn(),
  useAddTestCaseLabel: vi.fn(),
  useRemoveTestCaseLabel: vi.fn(),
}));

import {
  useAddTestCaseLabel,
  useLabels,
  useRemoveTestCaseLabel,
} from "@/features/labels/hooks";
import { LabelSelect } from "@/features/labels/LabelSelect";

const smoke = { id: "l1", name: "smoke", color: "#22c55e" } as Label;
const flaky = { id: "l2", name: "flaky", color: "#ef4444" } as Label;

const add = { mutate: vi.fn(), isPending: false };
const remove = { mutate: vi.fn(), isPending: false };

const renderSelect = (assigned: Label[], labels: Label[] = [smoke, flaky]) => {
  vi.mocked(useLabels).mockReturnValue({ data: labels } as ReturnType<
    typeof useLabels
  >);
  render(
    <LabelSelect projectId="p1" suiteId="s1" caseId="c1" assigned={assigned} />,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  add.isPending = false;
  vi.mocked(useAddTestCaseLabel).mockReturnValue(
    add as unknown as ReturnType<typeof useAddTestCaseLabel>,
  );
  vi.mocked(useRemoveTestCaseLabel).mockReturnValue(
    remove as unknown as ReturnType<typeof useRemoveTestCaseLabel>,
  );
});

describe("LabelSelect", () => {
  it("opens the label list and marks assigned labels as pressed", async () => {
    renderSelect([smoke]);
    const trigger = screen.getByRole("button", { name: "Manage labels" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "smoke" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "flaky" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("assigns an unassigned label", async () => {
    renderSelect([]);
    await userEvent.click(screen.getByRole("button", { name: "Add labels" }));

    await userEvent.click(screen.getByRole("button", { name: "flaky" }));

    expect(add.mutate).toHaveBeenCalledWith("l2");
    expect(remove.mutate).not.toHaveBeenCalled();
  });

  it("removes an assigned label", async () => {
    renderSelect([smoke]);
    await userEvent.click(
      screen.getByRole("button", { name: "Manage labels" }),
    );

    await userEvent.click(screen.getByRole("button", { name: "smoke" }));

    expect(remove.mutate).toHaveBeenCalledWith("l1");
  });

  it("disables the labels while a change is saving", async () => {
    add.isPending = true;
    renderSelect([]);
    await userEvent.click(screen.getByRole("button", { name: "Add labels" }));

    expect(screen.getByRole("button", { name: "flaky" })).toBeDisabled();
  });

  it("points to the Labels tab when the project has no labels", async () => {
    renderSelect([], []);
    await userEvent.click(screen.getByRole("button", { name: "Add labels" }));

    expect(screen.getByText("No labels yet")).toBeInTheDocument();
  });
});
