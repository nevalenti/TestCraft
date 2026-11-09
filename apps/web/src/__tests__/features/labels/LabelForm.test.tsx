import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LabelForm } from "@/features/labels/LabelForm";

const setup = () => {
  const onSubmit = vi.fn();
  render(
    <LabelForm
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      isLoading={false}
      submitLabel="Save"
    />,
  );
  return onSubmit;
};

describe("LabelForm", () => {
  it("shows an announced error and does not submit without a name", async () => {
    const onSubmit = setup();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Name is required",
    );
    expect(screen.getByLabelText("Name")).toBeInvalid();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("exposes the selected preset color as pressed", async () => {
    setup();
    const swatch = screen.getByRole("button", { name: "Color #22c55e" });

    await userEvent.click(swatch);

    expect(swatch).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Custom color")).toBeInTheDocument();
  });
});
