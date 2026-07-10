import { render, screen } from "@testing-library/react";
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

vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

import { Header } from "@/layout/Header";

describe("Header", () => {
  it("renders the mobile nav drawer checkbox unchecked by default", () => {
    render(<Header />);

    const checkbox = document.querySelector(
      "#mobile-nav-drawer",
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  describe("when a drawer nav item is clicked", () => {
    it("closes the drawer by unchecking the toggle", async () => {
      render(<Header />);
      const checkbox = document.querySelector(
        "#mobile-nav-drawer",
      ) as HTMLInputElement;
      checkbox.checked = true;

      await userEvent.click(screen.getByRole("link", { name: /projects/i }));

      expect(checkbox.checked).toBe(false);
    });
  });
});
