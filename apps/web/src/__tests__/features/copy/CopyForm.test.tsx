import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CopyForm } from "@/features/copy/CopyForm";

const target = {
  label: "Copy to suite",
  defaultValue: "suite-1",
  options: [
    { value: "suite-1", label: "Login" },
    { value: "suite-2", label: "Checkout" },
  ],
};

describe("CopyForm", () => {
  it("submits no name and the preselected target by default", async () => {
    const onSubmit = vi.fn();
    render(
      <CopyForm
        target={target}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isLoading={false}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: undefined,
      target: "suite-1",
    });
  });

  it("submits the chosen target and the trimmed name", async () => {
    const onSubmit = vi.fn();
    render(
      <CopyForm
        target={target}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        isLoading={false}
      />,
    );

    await userEvent.selectOptions(
      screen.getByLabelText("Copy to suite"),
      "Checkout",
    );
    await userEvent.type(screen.getByLabelText(/Name/), "  Smoke  ");
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Smoke",
      target: "suite-2",
    });
  });

  it("shows no target field when none is offered", async () => {
    const onSubmit = vi.fn();
    render(
      <CopyForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />,
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: undefined,
      target: undefined,
    });
  });
});
