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
      expect(screen.getByRole("button", { name: /mode/i })).toBeInTheDocument();
    });
  });

  describe("initial state — starts in dark mode", () => {
    it("label offers to switch to light mode", () => {
      renderWithTheme(<ThemeToggle />);
      expect(
        screen.getByRole("button", { name: /switch to light mode/i }),
      ).toBeInTheDocument();
    });
  });

  describe("when the toggle is clicked — switches to light mode", () => {
    it("label changes to offer switching back to dark mode", async () => {
      renderWithTheme(<ThemeToggle />);
      await userEvent.click(
        screen.getByRole("button", { name: /switch to light mode/i }),
      );
      expect(
        screen.getByRole("button", { name: /switch to dark mode/i }),
      ).toBeInTheDocument();
    });

    it("calls toggleTheme on click", async () => {
      const toggleTheme = vi.fn();

      vi.spyOn(
        await import("@/contexts/ThemeContext"),
        "useTheme",
      ).mockReturnValue({ isDark: true, toggleTheme });

      renderWithTheme(<ThemeToggle />);
      await userEvent.click(
        screen.getByRole("button", { name: /switch to light mode/i }),
      );
      expect(toggleTheme).toHaveBeenCalledOnce();
    });
  });
});
