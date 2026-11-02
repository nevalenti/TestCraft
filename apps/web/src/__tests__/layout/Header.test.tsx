import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const willRouteMatch = () => false;

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    onClick,
  }: {
    children?: React.ReactNode;
    to: string;
    onClick?: () => void;
  }) => (
    <a href={to} onClick={onClick}>
      {children}
    </a>
  ),
  useMatchRoute: () => willRouteMatch,
}));

vi.mock("@/layout/AccountMenu", () => ({
  AccountMenu: () => <div data-testid="account-menu" />,
}));

import { Header } from "@/layout/Header";

const openMenuButton = () =>
  screen.getByRole("button", { name: "Open navigation menu" });

const drawerToggle = () =>
  document.querySelector("#mobile-nav-drawer") as HTMLInputElement;

describe("Header", () => {
  it("renders the mobile nav drawer closed by default", () => {
    render(<Header />);

    expect(drawerToggle().checked).toBe(false);
    expect(openMenuButton()).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the hidden drawer toggle out of the tab order", () => {
    render(<Header />);

    expect(drawerToggle()).toHaveAttribute("tabindex", "-1");
  });

  it("opens the drawer from the keyboard and moves focus into it", async () => {
    render(<Header />);

    await userEvent.tab();
    expect(openMenuButton()).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    fireEvent.transitionEnd(document.querySelector(".drawer-side")!, {
      propertyName: "visibility",
    });

    expect(drawerToggle().checked).toBe(true);
    expect(openMenuButton()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveFocus();
  });

  it("closes the drawer on Escape and returns focus to the menu button", async () => {
    render(<Header />);
    await userEvent.click(openMenuButton());

    await userEvent.keyboard("{Escape}");

    expect(drawerToggle().checked).toBe(false);
    expect(openMenuButton()).toHaveFocus();
  });

  describe("when a drawer nav item is clicked", () => {
    it("closes the drawer", async () => {
      render(<Header />);
      await userEvent.click(openMenuButton());

      const mobileNav = screen.getByRole("navigation", {
        name: "Mobile navigation",
      });
      await userEvent.click(
        within(mobileNav).getByRole("link", { name: /projects/i }),
      );

      expect(drawerToggle().checked).toBe(false);
    });
  });
});
