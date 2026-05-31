import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CookieConsent } from "@/components/CookieConsent";

vi.mock("@/hooks/useCookieConsent", () => ({
  useCookieConsent: vi.fn(),
}));

import { useCookieConsent } from "@/hooks/useCookieConsent";

const mockConsent = (overrides: Partial<ReturnType<typeof useCookieConsent>>) =>
  vi.mocked(useCookieConsent).mockReturnValue({
    consent: null,
    isShowing: true,
    accept: vi.fn(),
    decline: vi.fn(),
    ...overrides,
  });

describe("CookieConsent", () => {
  describe("when isShowing is true — renders the banner", () => {
    it("shows the cookie consent dialog", () => {
      mockConsent({ isShowing: true });
      render(<CookieConsent />);
      expect(
        screen.getByRole("dialog", { name: "Cookie consent" }),
      ).toBeInTheDocument();
    });

    it("shows the Accept all button", () => {
      mockConsent({ isShowing: true });
      render(<CookieConsent />);
      expect(
        screen.getByRole("button", { name: "Accept all" }),
      ).toBeInTheDocument();
    });

    it("shows the Decline button", () => {
      mockConsent({ isShowing: true });
      render(<CookieConsent />);
      expect(
        screen.getByRole("button", { name: "Decline" }),
      ).toBeInTheDocument();
    });
  });

  describe("when isShowing is false — renders nothing", () => {
    it("does not render the dialog", () => {
      mockConsent({ isShowing: false });
      render(<CookieConsent />);
      expect(
        screen.queryByRole("dialog", { name: "Cookie consent" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("when Accept all is clicked — calls accept", () => {
    it("invokes the accept handler", async () => {
      const accept = vi.fn();
      mockConsent({ isShowing: true, accept });
      render(<CookieConsent />);
      await userEvent.click(screen.getByRole("button", { name: "Accept all" }));
      expect(accept).toHaveBeenCalledOnce();
    });
  });

  describe("when Decline is clicked — calls decline", () => {
    it("invokes the decline handler", async () => {
      const decline = vi.fn();
      mockConsent({ isShowing: true, decline });
      render(<CookieConsent />);
      await userEvent.click(screen.getByRole("button", { name: "Decline" }));
      expect(decline).toHaveBeenCalledOnce();
    });
  });
});
