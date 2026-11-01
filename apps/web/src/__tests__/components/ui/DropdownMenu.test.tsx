import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DropdownMenu } from "@/components/ui/DropdownMenu";

const renderMenu = (onAction = vi.fn()) => {
  render(
    <>
      <DropdownMenu label="Actions" trigger="…">
        <li>
          <button type="button" onClick={onAction}>
            Rename
          </button>
        </li>
      </DropdownMenu>
      <button type="button">Outside</button>
    </>,
  );
  return {
    trigger: screen.getByRole("button", { name: "Actions" }),
    onAction,
  };
};

describe("DropdownMenu", () => {
  it("starts closed with its items hidden", () => {
    const { trigger } = renderMenu();

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Rename" }),
    ).not.toBeInTheDocument();
  });

  it("opens from the keyboard", async () => {
    const { trigger } = renderMenu();

    await userEvent.tab();
    await userEvent.keyboard("{Enter}");

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Rename" })).toBeVisible();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);
    await userEvent.tab();

    await userEvent.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("closes after an item is chosen", async () => {
    const { trigger, onAction } = renderMenu();
    await userEvent.click(trigger);

    await userEvent.click(screen.getByRole("button", { name: "Rename" }));

    expect(onAction).toHaveBeenCalledOnce();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on a click outside", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);

    await userEvent.click(screen.getByRole("button", { name: "Outside" }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when focus leaves the menu", async () => {
    const { trigger } = renderMenu();
    await userEvent.click(trigger);

    await userEvent.tab();
    await userEvent.tab();

    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
