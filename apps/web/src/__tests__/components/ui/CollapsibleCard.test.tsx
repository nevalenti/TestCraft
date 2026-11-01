import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { CollapsibleCard } from "@/components/ui/CollapsibleCard";

const renderCard = () =>
  render(
    <CollapsibleCard title="Needs attention" storageKey="test-card">
      <p>Card body</p>
    </CollapsibleCard>,
  );

describe("CollapsibleCard", () => {
  beforeEach(() => localStorage.clear());

  it("starts expanded and collapses from its header", async () => {
    renderCard();
    const toggle = screen.getByRole("button", { name: /Needs attention/ });

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Card body")).toBeVisible();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Card body")).not.toBeVisible();
  });

  it("remembers that it was collapsed", async () => {
    const { unmount } = renderCard();
    await userEvent.click(
      screen.getByRole("button", { name: /Needs attention/ }),
    );
    unmount();

    renderCard();

    expect(
      screen.getByRole("button", { name: /Needs attention/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});
