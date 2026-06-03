import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeProvider } from "@/contexts/ThemeContext";

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("ThemeToggle", () => {
  describe("renders an accessible toggle", () => {
    it("renders a button with an accessible label", () => {
      renderWithTheme(<ThemeToggle />);
      expect(
        screen.getByRole("button", { name: /switch to/i }),
      ).toBeInTheDocument();
    });
  });

  describe("initial state — starts in light mode", () => {
    it("label indicates switching to dark mode", () => {
      renderWithTheme(<ThemeToggle />);
      expect(
        screen.getByRole("button", { name: "Switch to dark mode" }),
      ).toBeInTheDocument();
    });
  });

  describe("when the toggle is clicked — switches to dark mode", () => {
    it("label changes to indicate switching back to light mode", async () => {
      renderWithTheme(<ThemeToggle />);
      await userEvent.click(
        screen.getByRole("button", { name: "Switch to dark mode" }),
      );
      expect(
        screen.getByRole("button", { name: "Switch to light mode" }),
      ).toBeInTheDocument();
    });

    it("calls toggleTheme on click", async () => {
      const toggleTheme = vi.fn();
      vi.spyOn(
        await import("@/contexts/ThemeContext"),
        "useTheme",
      ).mockReturnValue({ isDark: false, toggleTheme });

      renderWithTheme(<ThemeToggle />);
      await userEvent.click(
        screen.getByRole("button", { name: "Switch to dark mode" }),
      );
      expect(toggleTheme).toHaveBeenCalledOnce();
    });
  });
});
