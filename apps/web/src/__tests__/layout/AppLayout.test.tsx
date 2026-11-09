import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Outlet: () => <p>page</p>,
}));
vi.mock("@/hooks/useFocusMainOnNavigation", () => ({
  useFocusMainOnNavigation: vi.fn(),
}));
vi.mock("@/layout/Header", () => ({
  Header: () => <button type="button">header</button>,
}));
vi.mock("@/layout/BreadcrumbBar", () => ({ BreadcrumbBar: () => null }));
vi.mock("@/layout/CookieConsent", () => ({ CookieConsent: () => null }));
vi.mock("@/layout/ToastStack", () => ({ ToastStack: () => null }));

import { AppLayout } from "@/layout/AppLayout";

describe("AppLayout", () => {
  it("makes the skip link the first tab stop and targets the main landmark", async () => {
    render(<AppLayout />);

    await userEvent.tab();

    const skipLink = screen.getByRole("link", { name: "Skip to content" });
    expect(skipLink).toHaveFocus();
    expect(skipLink).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });
});
